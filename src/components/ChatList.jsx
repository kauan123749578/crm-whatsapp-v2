import React from 'react';
import { Search, Filter, MoreVertical, User } from 'lucide-react';

const ChatList = ({ chats, activeChatId, onSelectChat, isLoading }) => {
    return (
        <div className="w-[350px] bg-[#1E1E1E] border-r border-white/10 flex flex-col h-full">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white tracking-tight">Mensagens</h2>
                <div className="flex gap-2 text-gray-400">
                    <Filter size={20} className="hover:text-white cursor-pointer" />
                    <MoreVertical size={20} className="hover:text-white cursor-pointer" />
                </div>
            </div>

            {/* Search */}
            <div className="px-5 py-4">
                <div className="relative group">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar contatos..."
                        className="w-full bg-[#121212] text-white pl-10 pr-4 py-3 rounded-xl border border-white/5 focus:border-accent/50 focus:outline-none transition-all placeholder:text-gray-600"
                    />
                </div>
            </div>

            {/* Filter Tabs (Optional but good for CRM) */}
            <div className="px-5 pb-2 flex gap-3 text-sm overflow-x-auto no-scrollbar">
                <button className="text-accent font-medium border-b-2 border-accent pb-1">Todos</button>
                <button className="text-gray-500 hover:text-gray-300 pb-1">Não lidos</button>
                <button className="text-gray-500 hover:text-gray-300 pb-1">Grupos</button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-5 py-4 border-b border-white/5 animate-pulse">
                            <div className="flex justify-between items-start mb-2">
                                <div className="h-4 bg-white/10 rounded w-32"></div>
                                <div className="h-3 bg-white/10 rounded w-12"></div>
                            </div>
                            <div className="h-3 bg-white/10 rounded w-48"></div>
                        </div>
                    ))
                ) : chats.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>Nenhuma conversa encontrada</p>
                    </div>
                ) : (
                    chats.map((chat) => {
                        const isActive = activeChatId === chat.id;
                        return (
                            <div
                                key={chat.id}
                                onClick={() => onSelectChat(chat.id)}
                                className={`
                      px-5 py-4 cursor-pointer transition-colors border-b border-white/5
                      ${isActive ? 'bg-white/5 border-l-2 border-l-accent' : 'hover:bg-white/5 border-l-2 border-l-transparent'}
                    `}
                            >
                                <div className="flex gap-3">
                                    {/* Profile Picture */}
                                    <div className="flex-shrink-0">
                                        {chat.profilePic ? (
                                            <img 
                                                src={chat.profilePic} 
                                                alt={chat.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                                onError={(e) => {
                                                    // Fallback se a imagem não carregar
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
                                            style={{ display: chat.profilePic ? 'none' : 'flex' }}
                                        >
                                            <User size={24} className="text-gray-400" />
                                        </div>
                                    </div>

                                    {/* Chat Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-semibold text-white truncate max-w-[70%]">{chat.name}</div>
                                            <div className="text-xs text-gray-500">{chat.time}</div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm text-gray-400 truncate max-w-[80%]">{chat.lastMessage}</div>
                                            {chat.unread > 0 && (
                                                <div className="bg-accent text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                                    {chat.unread}
                                                </div>
                                            )}
                                        </div>

                                        {/* Tags preview */}
                                        <div className="flex gap-1 mt-2">
                                            {chat.tags && chat.tags.map((tag, i) => (
                                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                                                    {tag}
                                                </span>
                                             ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ChatList;
