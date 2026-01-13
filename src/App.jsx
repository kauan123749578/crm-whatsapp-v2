import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import ChannelSwitcher from './components/ChannelSwitcher';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import RightSidebar from './components/RightSidebar';
import SettingsView from './components/SettingsView';
import { whatsappWebService } from './services/whatsappWebService';

// Mock Data (Fallback)
const INITIAL_CHATS = [
  {
    id: 1,
    name: 'Alice Freeman',
    lastMessage: 'Beleza! Me manda o contrato.',
    time: '10:42',
    unread: 2,
    stage: 'Negociação',
    tags: ['Lead Quente', 'Negociação'],
    messages: [
      { id: 1, text: 'Oi Alice, só acompanhando nossa conversa.', time: '10:30', sender: 'me' },
      { id: 2, text: 'Sim, tive uma chance de rever a proposta.', time: '10:35', sender: 'them' },
      { id: 3, text: 'Parece ótimo. Podemos ajustar os termos?', time: '10:36', sender: 'them' },
      { id: 4, text: 'Com certeza. Posso atualizar isso para você agora.', time: '10:40', sender: 'me' },
      { id: 5, text: 'Beleza! Me manda o contrato.', time: '10:42', sender: 'them' }
    ]
  },
  {
    id: 2,
    name: 'Tech Solutions Inc.',
    lastMessage: 'Podemos agendar uma demo?',
    time: 'Ontem',
    unread: 0,
    stage: 'Entrada',
    tags: ['Frio'],
    messages: [
      { id: 1, text: 'Olá, vi seu site.', time: 'Ontem', sender: 'them' },
      { id: 2, text: 'Podemos agendar uma demo?', time: 'Ontem', sender: 'them' }
    ]
  },
  { id: 3, name: 'John Doe', lastMessage: 'Obrigado pela informação.', time: 'Ontem', unread: 0, stage: 'Contatado', tags: [] },
  { id: 4, name: 'Equipe de Marketing', lastMessage: 'Reunião às 15h', time: 'Seg', unread: 5, stage: 'Ganho', tags: ['Interno'] },
  { id: 5, name: 'Sarah Connor', lastMessage: 'Eu voltarei.', time: 'Dom', unread: 0, stage: 'Perdido', tags: ['Lead'] },
];

const INITIAL_TAGS = [
  { id: '1', name: 'Lead Quente', color: '#EF4444' }, // Vermelho
  { id: '2', name: 'Negociação', color: '#F59E0B' }, // Âmbar
  { id: '3', name: 'Frio', color: '#3B82F6' }, // Azul
  { id: '4', name: 'Interno', color: '#6B7280' }, // Cinza
  { id: '5', name: 'Lead', color: '#FFD700' }, // Dourado
];

const INITIAL_STAGES = [
  { id: '1', name: 'Entrada' },
  { id: '2', name: 'Contatado' },
  { id: '3', name: 'Negociação' },
  { id: '4', name: 'Ganho' },
  { id: '5', name: 'Perdido' }
];

function App() {
  const [activeChannel, setActiveChannel] = useState('wa1');
  const [selectedChatId, setSelectedChatId] = useState(1);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // State for data
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [availableTags, setAvailableTags] = useState(INITIAL_TAGS);
  const [funnelStages, setFunnelStages] = useState(INITIAL_STAGES);
  const [loading, setLoading] = useState(false);
  
  // Estado para rastrear quais instâncias WhatsApp estão conectadas
  const [connectedInstances, setConnectedInstances] = useState(new Set());
  const chatsFetchInFlightRef = useRef(new Set()); // instanceName(s) currently fetching
  const chatsRetryTimerRef = useRef(new Map()); // instanceName -> timer id

  // Cleanup de timers (evita retries "fantasma" após trocar de página/canal)
  useEffect(() => {
    return () => {
      chatsRetryTimerRef.current.forEach((t) => clearTimeout(t));
      chatsRetryTimerRef.current.clear();
      chatsFetchInFlightRef.current.clear();
    };
  }, []);

  const activeChat = chats.find(c => c.id === selectedChatId);

  // Constants
  const TAG_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#FFD700'];

  // Socket.IO global para o App (compartilhado)
  const [appSocket, setAppSocket] = useState(null);
  const activeChannelRef = useRef(activeChannel);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  // Listener para status de conexão via Socket.IO
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'], // Polling primeiro (mais confiável)
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Conectado ao servidor via WebSocket');
    });

    const handleStatusChange = (data) => {
      if (data.status === 'ready' && ['wa1', 'wa2', 'wa3'].includes(data.instanceName)) {
        console.log(`✅ Instância ${data.instanceName} está pronta!`);
        setConnectedInstances(prev => {
          // Se já estava conectado, não disparar load de novo
          if (prev.has(data.instanceName)) return prev;
          const newSet = new Set(prev);
          newSet.add(data.instanceName);

          // Se for o canal ativo, carregar chats automaticamente
          if (activeChannelRef.current === data.instanceName) {
            console.log(`🔄 Carregando chats automaticamente para ${data.instanceName}...`);
            setTimeout(() => loadWhatsAppChats(data.instanceName), 1500);
          }

          return newSet;
        });
      }
    };

    socket.on('status-change', handleStatusChange);

    setAppSocket(socket);

    return () => {
      socket.off('status-change', handleStatusChange);
      socket.disconnect();
    };
  }, []);

  // Garantir que o socket global do App esteja conectado ao room da instância ativa.
  // Sem isso, o App não recebe o 'ready' e fica preso em "Aguardando conexão...".
  useEffect(() => {
    if (!appSocket) return;
    if (['wa1', 'wa2', 'wa3'].includes(activeChannel)) {
      appSocket.emit('connect-instance', { instanceName: activeChannel });
    }
  }, [appSocket, activeChannel]);

  // Load Chats based on Active Channel - APENAS se instância estiver conectada
  useEffect(() => {
    // If setting, do nothing
    if (activeChannel === 'settings') return;

    // Is it a WhatsApp channel?
    if (['wa1', 'wa2', 'wa3'].includes(activeChannel)) {
      // SÓ buscar chats se a instância estiver conectada e pronta
      // NÃO verificar automaticamente - aguardar evento do Socket.IO
      if (connectedInstances.has(activeChannel)) {
        console.log(`🔄 Carregando chats para ${activeChannel} (instância conectada)`);
        loadWhatsAppChats(activeChannel);
      } else {
        console.log(`⏳ Aguardando conexão da instância ${activeChannel}...`);
        // NÃO verificar automaticamente - apenas mostrar mensagem
        setChats([]);
      }
    } else {
      // Fallback or other channels
       setChats(INITIAL_CHATS);
    }
  }, [activeChannel, connectedInstances]);

  // Load Messages when chat is selected
  useEffect(() => {
      if (!selectedChatId || !['wa1', 'wa2', 'wa3'].includes(activeChannel)) return;

      const chat = chats.find(c => c.id === selectedChatId);
      // Only load if messages haven't been loaded yet
      if (chat && (!chat.messages || chat.messages.length === 0)) {
          loadMessagesForChat(selectedChatId);
      }
  }, [selectedChatId, activeChannel]);

  // Poll for new messages in active chat
  useEffect(() => {
      if (!selectedChatId || !['wa1', 'wa2', 'wa3'].includes(activeChannel)) return;

      const chat = chats.find(c => c.id === selectedChatId);
      // Only poll if messages are already loaded
      if (!chat || !chat.messages || chat.messages.length === 0) return;

      const pollInterval = setInterval(() => {
          pollNewMessages(selectedChatId);
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(pollInterval);
  }, [selectedChatId, activeChannel, chats]);


  const loadWhatsAppChats = async (channelKey) => {
      console.log('Loading chats for', channelKey);

      // Throttle: evita múltiplas chamadas simultâneas que derrubam o Puppeteer
      if (chatsFetchInFlightRef.current.has(channelKey)) {
          return;
      }
      chatsFetchInFlightRef.current.add(channelKey);

      setLoading(true);
      try {
          const apiChats = await whatsappWebService.getChats(channelKey);
          console.log('whatsapp-web.js getChats response:', apiChats);
          
          // 503: backend em warmup/restart. Re-tentar com backoff simples.
          if (apiChats === null) {
              const prevTimer = chatsRetryTimerRef.current.get(channelKey);
              if (!prevTimer) {
                  chatsRetryTimerRef.current.set(channelKey, setTimeout(() => {
                      chatsRetryTimerRef.current.delete(channelKey);
                      loadWhatsAppChats(channelKey);
                  }, 3000));
              }
              return;
          }

          if (apiChats && Array.isArray(apiChats) && apiChats.length > 0) {
              // Formata os chats básicos
              const formattedChats = apiChats.map(chat => ({
                  id: chat.id,
                  name: chat.name || chat.id?.split('@')[0] || 'Sem nome',
                  lastMessage: chat.lastMessage || '',
                  time: chat.timestamp ? new Date(chat.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Hoje',
                  unread: parseInt(chat.unreadCount || '0'),
                  stage: 'Entrada',
                  tags: [],
                  messages: null,
                  profilePic: null // Será carregado em seguida
              }));
              
              console.log('Formatted chats:', formattedChats.length, 'chats');
              
              setChats(formattedChats);
              console.log('✅ Chats set in state:', formattedChats.length);
              
              if (!selectedChatId && formattedChats.length > 0) {
                  setSelectedChatId(formattedChats[0].id);
                  console.log('✅ Selected first chat:', formattedChats[0].name);
              }

              // Buscar fotos de perfil em paralelo usando Promise.all (corrige race condition)
              const profilePicPromises = formattedChats.map(async (chat) => {
                  try {
                      const profilePicUrl = await whatsappWebService.getProfilePicture(channelKey, chat.id);
                      if (profilePicUrl) {
                          console.log('Got profile pic for', chat.name, ':', profilePicUrl);
                          return { chatId: chat.id, profilePic: profilePicUrl };
                      }
                  } catch (e) {
                      console.error('Failed to get profile pic for', chat.name, e);
                  }
                  return null;
              });

              const profilePicResults = await Promise.all(profilePicPromises);
              
              // Atualizar chats com fotos de perfil
              setChats(prevChats => prevChats.map(chat => {
                  const picResult = profilePicResults.find(r => r && r.chatId === chat.id);
                  return picResult ? { ...chat, profilePic: picResult.profilePic } : chat;
              }));
          } else {
              console.log('No chats to display');
              setChats([]);
          }
      } catch (e) {
          console.error("Error loading chats:", e);
          setChats([]);
      } finally {
          chatsFetchInFlightRef.current.delete(channelKey);
          setLoading(false);
      }
  };

  const loadMessagesForChat = async (chatId) => {
    setChats(prevChats => prevChats.map(c => 
        c.id === chatId ? { ...c, loadingMessages: true } : c
    ));

    try {
        const apiMessages = await whatsappWebService.getMessages(activeChannel, chatId, 50);
        
        if (apiMessages && Array.isArray(apiMessages)) {
            const formattedMessages = apiMessages.map(msg => ({
                id: msg.id,
                text: msg.text || '[Sem texto]',
                time: msg.time || new Date(msg.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                sender: msg.fromMe ? 'me' : 'them'
            }));

            setChats(prevChats => prevChats.map(c => 
                c.id === chatId ? { ...c, messages: formattedMessages, loadingMessages: false } : c
            ));
        } else {
            setChats(prevChats => prevChats.map(c => 
                c.id === chatId ? { ...c, messages: [], loadingMessages: false } : c
            ));
        }
    } catch(e) {
        console.error("Failed to load messages", e);
        setChats(prevChats => prevChats.map(c => 
            c.id === chatId ? { ...c, messages: [], loadingMessages: false } : c
        ));
    }
  };

  const pollNewMessages = async (chatId) => {
    try {
        const apiMessages = await whatsappWebService.getMessages(activeChannel, chatId, 10);
        
        if (apiMessages && Array.isArray(apiMessages)) {
            const formattedMessages = apiMessages.map(msg => ({
                id: msg.id,
                text: msg.text || '[Sem texto]',
                time: msg.time || new Date(msg.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                sender: msg.fromMe ? 'me' : 'them'
            }));

            setChats(prevChats => prevChats.map(c => {
                if (c.id !== chatId) return c;
                
                const currentMessages = c.messages || [];
                const existingIds = new Set(currentMessages.map(m => m.id));
                
                const newMessages = formattedMessages.filter(m => !existingIds.has(m.id));
                
                if (newMessages.length === 0) return c;
                
                const allMessages = [...currentMessages, ...newMessages];
                return { 
                    ...c, 
                    messages: allMessages,
                    lastMessage: newMessages[newMessages.length - 1].text,
                    time: 'Agora'
                };
            }));
        }
    } catch(e) {
        // Silently fail
    }
  };

  const handleSendMessage = async (text) => {
      if(!activeChat) return;

      // Optimistic Update
      const newMessage = { 
          id: Date.now(), 
          text, 
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
          sender: 'me' 
      };

      const updatedChats = chats.map(chat => {
          if (chat.id === activeChat.id) {
              return {
                  ...chat,
                  lastMessage: text,
                  time: 'Agora',
                  messages: [...(chat.messages || []), newMessage]
              };
          }
          return chat;
      });
      setChats(updatedChats);

      if (['wa1', 'wa2', 'wa3'].includes(activeChannel)) {
          try {
              await whatsappWebService.sendMessage(activeChannel, activeChat.id, text);
          } catch (e) {
              console.error("Failed to send", e);
              // Reverter atualização otimista em caso de erro
              setChats(chats);
          }
      }
  };


  // Handlers
  const handleAddGlobalTag = (tagName) => {
    if (availableTags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) return;

    const newTag = {
      id: Date.now().toString(),
      name: tagName,
      color: TAG_COLORS[availableTags.length % TAG_COLORS.length]
    };
    setAvailableTags([...availableTags, newTag]);
  };

  const handleDeleteGlobalTag = (tagId) => {
    setAvailableTags(availableTags.filter(t => t.id !== tagId));
  };

  const handleUpdateContactTags = (chatId, newTags) => {
    setChats(chats.map(chat =>
      chat.id === chatId ? { ...chat, tags: newTags } : chat
    ));
  };

  // Funnel Handlers
  const handleAddStage = (stageName) => {
    if (!stageName.trim()) return;
    const newStage = { id: Date.now().toString(), name: stageName };
    setFunnelStages([...funnelStages, newStage]);
  };

  const handleUpdateStage = (id, newName) => {
    setFunnelStages(funnelStages.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const handleDeleteStage = (id) => {
    setFunnelStages(funnelStages.filter(s => s.id !== id));
  };

  const handleReorderStage = (index, direction) => {
    const newStages = [...funnelStages];
    if (direction === 'up' && index > 0) {
      [newStages[index], newStages[index - 1]] = [newStages[index - 1], newStages[index]];
    } else if (direction === 'down' && index < newStages.length - 1) {
      [newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]];
    }
    setFunnelStages(newStages);
  };

  const handleUpdateContactStage = (chatId, newStageName) => {
    setChats(chats.map(chat =>
      chat.id === chatId ? { ...chat, stage: newStageName } : chat
    ));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121212] text-white font-sans selection:bg-[#FFD700] selection:text-black">

      {/* Sidebar Left - Channel Switcher */}
      <ChannelSwitcher
        activeChannel={activeChannel}
        onSelectChannel={setActiveChannel}
      />

      {activeChannel === 'settings' ? (
        <SettingsView
          availableTags={availableTags}
          onAddTag={handleAddGlobalTag}
          onDeleteTag={handleDeleteGlobalTag}

          funnelStages={funnelStages}
          onAddStage={handleAddStage}
          onUpdateStage={handleUpdateStage}
          onDeleteStage={handleDeleteStage}
          onReorderStage={handleReorderStage}
          socket={appSocket}

          onWhatsAppStatusChange={({ instanceName, status }) => {
            if (status === 'ready' && ['wa1', 'wa2', 'wa3'].includes(instanceName)) {
              setConnectedInstances((prev) => {
                const next = new Set(prev);
                next.add(instanceName);
                return next;
              });
            }
          }}
        />
      ) : (
        <>
          {/* Chat List */}
          <ChatList
            chats={chats}
            activeChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            isLoading={loading}
          />

          {/* Main Chat Area */}
          <ChatWindow
            activeChat={activeChat}
            showSidebar={showRightSidebar}
            onToggleSidebar={() => setShowRightSidebar(!showRightSidebar)}
            onSendMessage={handleSendMessage}
          />

          {/* Sidebar Right - Details */}
          {showRightSidebar && activeChat && (
            <div className="hidden xl:block h-full">
              <RightSidebar
                contact={activeChat}
                onClose={() => setShowRightSidebar(false)}
                availableTags={availableTags}
                onUpdateTags={(newTags) => handleUpdateContactTags(activeChat.id, newTags)}

                funnelStages={funnelStages}
                onUpdateStage={(newStage) => handleUpdateContactStage(activeChat.id, newStage)}
              />
            </div>
          )}

          {/* Mobile Right Sidebar (Overlay) */}
          {showRightSidebar && activeChat && (
            <div className="fixed inset-y-0 right-0 z-50 xl:hidden shadow-2xl">
              <RightSidebar
                contact={activeChat}
                onClose={() => setShowRightSidebar(false)}
                availableTags={availableTags}
                onUpdateTags={(newTags) => handleUpdateContactTags(activeChat.id, newTags)}

                funnelStages={funnelStages}
                onUpdateStage={(newStage) => handleUpdateContactStage(activeChat.id, newStage)}
              />
            </div>
          )}
        </>
      )}

    </div>
  );
}

export default App;
