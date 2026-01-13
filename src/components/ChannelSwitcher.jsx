import React, { useState } from 'react';
import { MessageCircle, Instagram, Phone, Settings } from 'lucide-react';
import logo from '../assets/logo.jpg';

const ChannelSwitcher = ({ activeChannel, onSelectChannel }) => {
    const channels = [
        { id: 'wa1', type: 'whatsapp', label: 'WA 1', icon: MessageCircle },
        { id: 'wa2', type: 'whatsapp', label: 'WA 2', icon: MessageCircle },
        { id: 'wa3', type: 'whatsapp', label: 'WA 3', icon: MessageCircle },
        { id: 'insta', type: 'instagram', label: 'Insta', icon: Instagram },
    ];

    return (
        <div className="w-[80px] flex flex-col items-center py-6 bg-black border-r border-white/10 shrink-0 gap-6">
            {/* Logo */}
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden">
                <img src={logo} alt="Antigravity Logo" className="w-full h-full object-contain" />
            </div>

            {/* Channels */}
            <div className="flex flex-col gap-4 w-full px-2">
                {channels.map((channel) => {
                    const isActive = activeChannel === channel.id;
                    const Icon = channel.icon;

                    return (
                        <button
                            key={channel.id}
                            onClick={() => onSelectChannel(channel.id)}
                            className={`
                group relative w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300
                ${isActive ? 'bg-white/10 text-accent' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}
              `}
                        >
                            {/* Active Indicator Bar */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" />
                            )}

                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />

                            {/* Channel Label (Number/Icon Badge) */}
                            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-black border border-white/10 px-1 rounded-full text-white">
                                {channel.label.split(' ')[1] || 'IG'}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings Button */}
            <button
                onClick={() => onSelectChannel('settings')}
                className={`
                    group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 mb-2
                    ${activeChannel === 'settings' ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}
                `}
            >
                {/* Active Indicator Bar */}
                {activeChannel === 'settings' && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}

                <Settings size={22} />
            </button>
        </div>
    );
};

export default ChannelSwitcher;
