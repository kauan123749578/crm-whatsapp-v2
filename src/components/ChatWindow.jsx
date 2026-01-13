import React, { useState } from 'react';
import { Paperclip, Mic, Send, Smile, Phone, Video, Search, ChevronLeft } from 'lucide-react';

const ChatWindow = ({ activeChat, onToggleSidebar, showSidebar, onSendMessage }) => {
    const [message, setMessage] = useState('');

    if (!activeChat) {
        return (
            <div className="flex-1 flex flex-col bg-[#121212] items-center justify-center text-gray-500">
                <div className="text-center">
                    <div className="w-16 h-16 bg-[#1E1E1E] rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">👋</span>
                    </div>
                    <p className="text-lg">Selecione uma conversa para iniciar</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#121212] relative">
            {/* Chat Header */}
            <div className="h-[72px] px-6 border-b border-white/10 flex items-center justify-between bg-[#121212]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold">
                        {activeChat.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg leading-none">{activeChat.name}</h3>
                        <span className="text-gray-500 text-xs">Visto por último hoje às 10:23</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    <Search size={20} className="hover:text-white cursor-pointer" />
                    <Phone size={20} className="hover:text-white cursor-pointer" />
                    <Video size={20} className="hover:text-white cursor-pointer" />
                    <button onClick={onToggleSidebar} className="xl:hidden">
                        <ChevronLeft size={24} className={`transform transition-transform ${showSidebar ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Date Separator */}
                <div className="flex justify-center">
                    <span className="bg-[#1E1E1E] text-gray-400 text-xs px-3 py-1 rounded-full">Hoje</span>
                </div>

                {activeChat?.loadingMessages ? (
                    // Loading skeleton for messages
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                <div className="animate-pulse">
                                    <div className={`h-16 ${i % 2 === 0 ? 'bg-accent/20' : 'bg-white/10'} rounded-2xl`} 
                                         style={{ width: `${150 + Math.random() * 120}px` }}>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activeChat?.messages?.length > 0 ? (
                    activeChat.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                   max-w-[70%] px-4 py-3 rounded-2xl text-sm relative group
                   ${msg.sender === 'me'
                                ? 'bg-accent text-black rounded-tr-none'
                                : 'bg-[#1E1E1E] text-white rounded-tl-none'}
                `}>
                                <p>{msg.text}</p>
                                <span className={`
                      text-[10px] mt-1 block text-right
                      ${msg.sender === 'me' ? 'text-black/60' : 'text-gray-500'}
                   `}>
                                    {msg.time}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Nenhuma mensagem</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#121212]">
                <div className="bg-[#1E1E1E] rounded-2xl flex items-end p-2 border border-white/5 focus-within:border-accent/50 transition-colors">
                    <button className="p-3 text-gray-400 hover:text-white transition-colors">
                        <Smile size={20} />
                    </button>
                    <button className="p-3 text-gray-400 hover:text-white transition-colors">
                        <Paperclip size={20} />
                    </button>

                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Digite uma mensagem..."
                        className="flex-1 bg-transparent text-white placeholder-gray-500 p-3 h-[48px] max-h-[120px] resize-none focus:outline-none scrollbar-hide"
                        rows={1}
                    />

                    {message.trim() ? (
                        <button 
                            onClick={() => {
                                if (onSendMessage) {
                                    onSendMessage(message);
                                    setMessage('');
                                }
                            }}
                            className="p-3 bg-accent text-black rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-accent/20"
                        >
                            <Send size={20} className="ml-0.5" />
                        </button>
                    ) : (
                        <button className="p-3 text-gray-400 hover:text-white transition-colors">
                            <Mic size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
