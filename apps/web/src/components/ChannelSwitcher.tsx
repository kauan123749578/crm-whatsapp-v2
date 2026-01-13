import React from 'react';

type Channel = {
  id: string;
  label: string;
};

type Props = {
  activeChannel: string;
  onSelectChannel: (channel: string) => void;
};

export default function ChannelSwitcher({ activeChannel, onSelectChannel }: Props) {
  const channels: Channel[] = [
    { id: 'wa1', label: 'WA 1' },
    { id: 'wa2', label: 'WA 2' },
    { id: 'wa3', label: 'WA 3' }
  ];

  return (
    <div className="w-20 flex flex-col items-center py-4 bg-black border-r border-zinc-800 shrink-0 gap-4">
      <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center mb-2 text-black font-bold text-lg">
        CRM
      </div>

      <div className="flex flex-col gap-2 w-full px-2">
        {channels.map((channel) => {
          const isActive = activeChannel === channel.id;
          return (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={`
                relative w-full aspect-square rounded-xl flex items-center justify-center transition-all
                ${isActive ? 'bg-zinc-800 text-yellow-400' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}
              `}
              title={channel.label}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-400 rounded-r-full" />}
              <span className="text-xs font-bold">{channel.label.split(' ')[1]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <button
        onClick={() => onSelectChannel('settings')}
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center transition-all
          ${activeChannel === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}
        `}
        title="Configurações"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}
