import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import type { Chat, Message } from './api';
import { fetchChats, fetchMessages, sendMessage, updateChatTags, updateChatStage, getCurrentUser } from './api';
import ChannelSwitcher from './components/ChannelSwitcher';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import RightSidebar from './components/RightSidebar';
import MetricsPanel from './components/MetricsPanel';
import Login from './components/Login';

type StatusPayload = {
  instanceId: string;
  status: string;
  message?: string;
};

type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    // Inicializar com dados salvos
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeChannel, setActiveChannel] = useState('wa1');
  const [instanceId, setInstanceId] = useState('wa1');
  const [status, setStatus] = useState<StatusPayload>({ instanceId: 'wa1', status: 'idle' });
  const [qr, setQr] = useState<string | null>(null);
  const [qrImg, setQrImg] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const retryTimer = useRef<number | null>(null);

  // Verificar autenticação ao carregar (só uma vez)
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      if (savedUser && savedToken) {
        try {
          // Tentar validar com backend
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setToken(savedToken);
            return;
          }
        } catch (e) {
          // Se falhar (modo dev ou token expirado), usar dados salvos
          try {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setToken(savedToken);
            return;
          } catch {
            // Ignore parse error
          }
        }
      }
      // Se não autenticado, limpar
      if (!savedUser || !savedToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    };
    void checkAuth();
  }, []); // Executar apenas uma vez ao montar

  const handleLogin = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const connect = () => {
    socketRef.current?.emit('wa:connect', { instanceId });
    setStatus({ instanceId, status: 'connecting', message: 'Inicializando...' });
  };

  const loadChats = async (id: string, force = false) => {
    if (loadingChats && !force) return;
    setLoadingChats(true);
    setChatError(null);
    try {
      const data = await fetchChats(id);
      if (data === null) {
        if (!retryTimer.current) {
          retryTimer.current = window.setTimeout(() => {
            retryTimer.current = null;
            void loadChats(id);
          }, 3000);
        }
        return;
      }
      setChats(data);
      if (!selectedChatId && data.length) setSelectedChatId(data[0].id);
    } catch (e: any) {
      setChatError(String(e?.message || e));
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMsgs = async (chatId: string) => {
    setLoadingMsgs(true);
    try {
      const data = await fetchMessages(instanceId, chatId, 80);
      setMessages(data);
    } finally {
      setLoadingMsgs(false);
    }
  };

  // Hooks devem ser chamados antes de qualquer return condicional
  useEffect(() => {
    if (!user || !token) return; // Sair se não autenticado
    
    const s = io({
      transports: ['polling', 'websocket'],
      reconnection: true
    });
    socketRef.current = s;

    s.on('connect', () => console.log('socket connected', s.id));

    s.on('wa:qr', (p: { instanceId: string; qr: string }) => {
      if (p.instanceId === instanceId) {
        setQr(p.qr);
      }
    });

    s.on('wa:status', (p: StatusPayload) => {
      if (p.instanceId === instanceId) {
        setStatus(p);
        if (p.status === 'ready') {
          void loadChats(instanceId, true);
        }
      }
    });

    s.on('wa:message', (p: { instanceId: string; message: any }) => {
      if (p.instanceId === instanceId) {
        // Se for do chat selecionado, adicionar mensagem
        if (p.message?.chatId === selectedChatId) {
          setMessages((prev) => {
            // Evitar duplicatas
            if (prev.some((m) => m.id === p.message.id)) return prev;
            return [
              ...prev,
              {
                id: p.message.id,
                chatId: p.message.chatId,
                body: p.message.body || '',
                fromMe: !!p.message.fromMe,
                ts: p.message.ts || 0,
                hasMedia: p.message.hasMedia || false,
                mediaType: p.message.mediaType || null
              }
            ];
          });
        }
        // Atualizar lista de chats automaticamente
        void loadChats(instanceId, true);
      }
    });

    // Listener para atualização de chat (mensagem nova, chat atualizado, etc)
    s.on('wa:chat_updated', (p: { instanceId: string; chatId: string; chat: any }) => {
      if (p.instanceId === instanceId) {
        // Atualizar chat na lista se existir
        setChats((prev) => {
          const existingIndex = prev.findIndex((c) => c.id === p.chatId);
          if (existingIndex >= 0) {
            // Atualizar chat existente, mas PRESERVAR tags, stage e nome
            const existing = prev[existingIndex];
            const updated = [...prev];
            
            // Lógica para preservar nome: se o nome novo for ID ou vazio, manter o existente
            const newName = p.chat.name;
            const shouldKeepExistingName = !newName || 
                                          newName === p.chatId || 
                                          newName.match(/^\d+@/) || 
                                          newName.length < 3;
            
            updated[existingIndex] = {
              ...existing, // Manter TODOS os dados existentes primeiro
              // Atualizar apenas campos que realmente mudam do WhatsApp
              unreadCount: p.chat.unreadCount !== undefined ? p.chat.unreadCount : existing.unreadCount,
              lastMessage: p.chat.lastMessage !== undefined ? p.chat.lastMessage : existing.lastMessage,
              lastTs: p.chat.lastTs !== undefined ? p.chat.lastTs : existing.lastTs,
              isGroup: p.chat.isGroup !== undefined ? p.chat.isGroup : existing.isGroup,
              // PRESERVAR tags e stage - NUNCA sobrescrever com undefined/null
              tags: Array.isArray(p.chat.tags) && p.chat.tags.length > 0 ? p.chat.tags : (existing.tags || []),
              stage: p.chat.stage || existing.stage || 'Entrada',
              // PRESERVAR nome - só atualizar se o novo for válido e diferente de ID
              name: shouldKeepExistingName ? existing.name : newName
            };
            // Mover para o topo (última mensagem)
            const [moved] = updated.splice(existingIndex, 1);
            return [moved, ...updated];
          } else {
            // Novo chat, adicionar no início (garantir tags e stage padrão)
            // Verificar se nome é válido (não é ID)
            let chatName = p.chat.name;
            if (!chatName || chatName === p.chatId || chatName.match(/^\d+@/) || chatName.length < 3) {
              // Tentar extrair nome do ID ou usar número
              const idPart = p.chatId.split('@')[0];
              chatName = idPart.length <= 20 ? idPart : `${idPart.substring(0, 17)}...`;
            }
            
            return [{
              ...p.chat,
              name: chatName,
              tags: Array.isArray(p.chat.tags) ? p.chat.tags : [],
              stage: p.chat.stage || 'Entrada'
            }, ...prev];
          }
        });
      }
    });

    return () => {
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
      s.disconnect();
    };
  }, [instanceId, selectedChatId, user, token]);

  useEffect(() => {
    if (!qr) {
      setQrImg(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(qr, { width: 260, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrImg(url);
      })
      .catch(() => {
        if (!cancelled) setQrImg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [qr]);

  useEffect(() => {
    setInstanceId(activeChannel);
    setStatus({ instanceId: activeChannel, status: 'idle' });
    setQr(null);
    setQrImg(null);
    setChats([]);
    setSelectedChatId(null);
    setMessages([]);
    setSearchQuery('');
    setShowRightSidebar(false);
    setShowMetrics(false);
  }, [activeChannel]);

  useEffect(() => {
    if (!user || !token || !selectedChatId) return;
    void loadMsgs(selectedChatId);
  }, [selectedChatId, instanceId, user, token]);

  const onSend = async (text: string, file?: File) => {
    if (!selectedChatId) return;
    try {
      await sendMessage(instanceId, selectedChatId, text, file);
      await loadMsgs(selectedChatId);
      // Lista de chats será atualizada automaticamente via Socket.IO
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleUpdateTags = async (tags: string[]) => {
    if (!selectedChatId) return;
    try {
      const updated = await updateChatTags(instanceId, selectedChatId, tags);
      setChats((prev) => prev.map((c) => {
        if (c.id === selectedChatId) {
          // NUNCA mudar o nome ao atualizar tags - sempre preservar o existente
          let finalName = c.name; // Sempre começar com o nome existente
          const updatedName = updated.name;
          const existingNameIsInvalid = !c.name || c.name === c.id || c.name.match(/^\d+@/) || c.name.length < 3;
          const updatedNameIsValid = updatedName && 
                                     updatedName !== updated.id && 
                                     !updatedName.match(/^\d+@/) && 
                                     updatedName.length >= 3;
          
          // Só mudar se o atual for inválido E o novo for válido
          if (existingNameIsInvalid && updatedNameIsValid) {
            finalName = updatedName;
          }
          
          return { 
            ...c, 
            tags: Array.isArray(updated.tags) ? updated.tags : (c.tags || []),
            stage: updated.stage || c.stage || 'Entrada',
            name: finalName // Sempre preservar nome existente
          };
        }
        return c;
      }));
      
      // Atualizar também o chat selecionado
      setSelectedChat((current) => {
        if (current && current.id === selectedChatId) {
          return { ...current, tags: Array.isArray(updated.tags) ? updated.tags : (current.tags || []) };
        }
        return current;
      });
    } catch (error) {
      console.error('Erro ao atualizar tags:', error);
    }
  };

  const handleUpdateStage = async (stage: string) => {
    if (!selectedChatId) return;
    try {
      const updated = await updateChatStage(instanceId, selectedChatId, stage);
      setChats((prev) => prev.map((c) => {
        if (c.id === selectedChatId) {
          // NUNCA mudar o nome ao atualizar stage - sempre preservar o existente
          let finalName = c.name;
          const updatedName = updated.name;
          const existingNameIsInvalid = !c.name || c.name === c.id || c.name.match(/^\d+@/) || c.name.length < 3;
          const updatedNameIsValid = updatedName && 
                                     updatedName !== updated.id && 
                                     !updatedName.match(/^\d+@/) && 
                                     updatedName.length >= 3;
          
          if (existingNameIsInvalid && updatedNameIsValid) {
            finalName = updatedName;
          }
          
          return { 
            ...c, 
            tags: updated.tags || c.tags || [],
            stage: updated.stage || c.stage || 'Entrada',
            name: finalName // Sempre preservar nome existente
          };
        }
        return c;
      }));
      
      // Atualizar também o chat selecionado
      setSelectedChat((current) => {
        if (current && current.id === selectedChatId) {
          return { ...current, stage: updated.stage || current.stage || 'Entrada' };
        }
        return current;
      });
    } catch (error) {
      console.error('Erro ao atualizar estágio:', error);
    }
  };

  // Se não está autenticado, mostrar tela de login (DEPOIS de todos os hooks)
  if (!user || !token) {
    return <Login onLogin={handleLogin} />;
  }

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  const statusColor =
    status.status === 'ready'
      ? 'bg-green-500'
      : status.status === 'qr'
        ? 'bg-yellow-500'
        : status.status === 'authenticated'
          ? 'bg-blue-500'
          : status.status === 'error'
            ? 'bg-red-500'
            : 'bg-zinc-500';

  return (
    <div className="h-full bg-zinc-950 text-zinc-100 flex">
      <ChannelSwitcher activeChannel={activeChannel} onSelectChannel={setActiveChannel} />

      <div className="flex-1 flex flex-col">
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Métricas
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                CRM WhatsApp v2
              </div>
            </div>
            <div className="text-xs text-zinc-400">{status.message || status.status}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-zinc-400">
              {user.name} <span className="text-zinc-500">({user.role === 'admin' ? 'Admin' : 'Funcionário'})</span>
            </div>
            <button
              className="bg-yellow-400 text-black px-3 py-1.5 rounded text-sm font-semibold hover:bg-yellow-300"
              onClick={connect}
            >
              Conectar
            </button>
            <button
              className="bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded text-sm hover:bg-zinc-700"
              onClick={() => void loadChats(instanceId, true)}
            >
              Atualizar chats
            </button>
            <button
              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <ChatList
            chats={chats}
            activeChatId={selectedChatId}
            onSelectChat={(id) => {
              setSelectedChatId(id);
              void loadMsgs(id);
            }}
            isLoading={loadingChats}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <div className="flex-1 flex">
            <ChatWindow
              chatName={selectedChat?.name || selectedChat?.id || null}
              messages={messages}
              onSendMessage={onSend}
              isLoading={loadingMsgs}
              onToggleSidebar={() => setShowRightSidebar(!showRightSidebar)}
              showSidebar={showRightSidebar}
            />

            {showRightSidebar && selectedChat && user && (
              <RightSidebar
                chat={selectedChat}
                instanceId={instanceId}
                onClose={() => setShowRightSidebar(false)}
                onUpdateTags={handleUpdateTags}
                onUpdateStage={handleUpdateStage}
                userRole={user.role}
              />
            )}
            {showMetrics && user?.role === 'admin' && (
              <MetricsPanel onClose={() => setShowMetrics(false)} />
            )}
          </div>
        </div>

        {qr && status.status !== 'ready' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="font-semibold mb-4 text-center text-white">Escaneie o QR Code</div>
              {qrImg ? (
                <div className="bg-white inline-block p-2 rounded">
                  <img src={qrImg} alt="QR Code" className="w-[260px] h-[260px]" />
                </div>
              ) : (
                <div className="text-xs break-all text-zinc-300">{qr}</div>
              )}
              <button
                onClick={() => setQr(null)}
                className="mt-4 w-full bg-zinc-800 text-white px-4 py-2 rounded hover:bg-zinc-700"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}