import React, { useState, useMemo } from 'react';
import type { Chat } from '../api';

type Props = {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export default function ChatList({ chats, activeChatId, onSelectChat, isLoading, searchQuery, onSearchChange }: Props) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');

  const filteredChats = useMemo(() => {
    let result = chats;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => (c.name || c.id).toLowerCase().includes(query));
    }

    if (filter === 'unread') {
      result = result.filter((c) => c.unreadCount > 0);
    } else if (filter === 'groups') {
      result = result.filter((c) => c.isGroup);
    }

    return result;
  }, [chats, searchQuery, filter]);

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Ontem';
    if (days < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const TAG_COLORS: Record<string, string> = {
    'Lead Quente': '#EF4444',
    'Negociação': '#F59E0B',
    'Frio': '#3B82F6',
    'Interno': '#6B7280',
    'Lead': '#FFD700'
  };

  const getTagColor = (tag: string) => TAG_COLORS[tag] || '#9CA3AF';

  return (
    <div className="w-[380px] bg-zinc-900/50 backdrop-blur-sm border-r border-zinc-800/50 flex flex-col h-full shadow-xl">
      <div className="p-5 border-b border-zinc-800/50 bg-zinc-900/80">
        <h2 className="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Mensagens</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar contatos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-950/80 text-white pl-10 pr-4 py-3 rounded-xl border border-zinc-800 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 text-sm transition-all duration-200"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="px-5 py-3 flex gap-2 text-sm border-b border-zinc-800/50 bg-zinc-900/50">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            filter === 'all' 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-md' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            filter === 'unread' 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-md' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          Não lidos
        </button>
        <button
          onClick={() => setFilter('groups')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            filter === 'groups' 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-md' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          Grupos
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-zinc-800 animate-pulse">
              <div className="flex justify-between items-start mb-2">
                <div className="h-4 bg-zinc-800 rounded w-32"></div>
                <div className="h-3 bg-zinc-800 rounded w-12"></div>
              </div>
              <div className="h-3 bg-zinc-800 rounded w-48"></div>
            </div>
          ))
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = activeChatId === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`
                  px-5 py-4 cursor-pointer transition-all duration-200 border-b border-zinc-800/30
                  ${isActive 
                    ? 'bg-gradient-to-r from-zinc-800/80 to-zinc-800/50 border-l-4 border-l-yellow-400 shadow-lg' 
                    : 'hover:bg-zinc-800/30 border-l-4 border-l-transparent hover:border-l-yellow-400/30'
                  }
                `}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 relative">
                    {chat.profilePicUrl ? (
                      <img
                        src={chat.profilePicUrl}
                        alt={chat.name || chat.id}
                        className="w-14 h-14 rounded-full object-cover border-2 border-zinc-700/50 shadow-lg ring-2 ring-zinc-800/50"
                        onError={(e) => {
                          // Fallback se a imagem não carregar
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const fallback = img.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                        onLoad={() => {
                          // Garantir que o fallback está escondido quando a imagem carregar
                          const img = document.querySelector(`img[alt="${chat.name || chat.id}"]`) as HTMLImageElement;
                          if (img && img.nextElementSibling) {
                            (img.nextElementSibling as HTMLElement).style.display = 'none';
                          }
                        }}
                        crossOrigin="anonymous"
                      />
                    ) : null}
                    <div
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-yellow-500/20 flex items-center justify-center text-white font-bold text-lg border-2 border-zinc-700/50 shadow-lg ring-2 ring-zinc-800/50 backdrop-blur-sm"
                      style={{ display: chat.profilePicUrl ? 'none' : 'flex' }}
                    >
                      <span className="bg-gradient-to-br from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        {(chat.name || chat.id).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-white truncate text-base">{chat.name || chat.id}</div>
                      <div className="text-xs text-zinc-500 font-medium">{formatTime(chat.lastTs)}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-zinc-400 truncate">{chat.lastMessage || ''}</div>
                      {chat.unreadCount > 0 && (
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem] text-center shadow-md">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>

                    {chat.tags && chat.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {chat.tags.slice(0, 2).map((tag, i) => {
                          const color = getTagColor(tag);
                          return (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border"
                              style={{ borderColor: `${color}40`, color }}
                            >
                              {tag}
                            </span>
                          );
                        })}
                        {chat.tags.length > 2 && <span className="text-[10px] text-zinc-500">+{chat.tags.length - 2}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


