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
    <div className="w-[350px] bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-3">Mensagens</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar contatos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-950 text-white pl-8 pr-4 py-2 rounded-lg border border-zinc-800 focus:border-yellow-400 focus:outline-none text-sm"
          />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
        </div>
      </div>

      <div className="px-4 py-2 flex gap-2 text-sm border-b border-zinc-800">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-yellow-400 text-black font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 rounded ${filter === 'unread' ? 'bg-yellow-400 text-black font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Não lidos
        </button>
        <button
          onClick={() => setFilter('groups')}
          className={`px-3 py-1 rounded ${filter === 'groups' ? 'bg-yellow-400 text-black font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                  px-4 py-4 cursor-pointer transition-colors border-b border-zinc-800
                  ${isActive ? 'bg-zinc-800 border-l-2 border-l-yellow-400' : 'hover:bg-zinc-800/50 border-l-2 border-l-transparent'}
                `}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                      {(chat.name || chat.id).charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-white truncate">{chat.name || chat.id}</div>
                      <div className="text-xs text-zinc-500">{formatTime(chat.lastTs)}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-zinc-400 truncate">{chat.lastMessage || ''}</div>
                      {chat.unreadCount > 0 && (
                        <div className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
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


