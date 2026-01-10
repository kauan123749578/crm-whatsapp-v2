import React, { useState, useEffect } from 'react';
import type { Chat, ContactInfo } from '../api';
import { getContactInfo } from '../api';

const FUNNEL_STAGES = ['Entrada', 'Contatado', 'Negociação', 'Ganho', 'Perdido'];
const AVAILABLE_TAGS = [
  { name: 'Lead Quente', color: '#EF4444' },
  { name: 'Negociação', color: '#F59E0B' },
  { name: 'Frio', color: '#3B82F6' },
  { name: 'Interno', color: '#6B7280' },
  { name: 'Lead', color: '#FFD700' }
];

type Props = {
  chat: Chat | null;
  instanceId: string;
  onClose: () => void;
  onUpdateTags: (tags: string[]) => void;
  onUpdateStage: (stage: string) => void;
  userRole?: 'admin' | 'employee';
};

export default function RightSidebar({ chat, instanceId, onClose, onUpdateTags, onUpdateStage, userRole = 'employee' }: Props) {
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [error, setError] = useState('');
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    if (chat && !chat.isGroup) {
      setLoadingContact(true);
      getContactInfo(instanceId, chat.id)
        .then(setContactInfo)
        .catch(() => setContactInfo(null))
        .finally(() => setLoadingContact(false));
    } else {
      setContactInfo(null);
    }
  }, [chat?.id, instanceId]);

  if (!chat) return null;

  const isAdmin = userRole === 'admin';
  const canEdit = isAdmin || !chat.userId; // Admin pode editar tudo, employee só se chat não tem dono ainda

  const activeStageIndex = FUNNEL_STAGES.findIndex((s) => s === (chat.stage || 'Entrada'));
  const availableToAdd = AVAILABLE_TAGS.filter((t) => !(chat.tags || []).includes(t.name));

  const handleAddTag = async (tagName: string) => {
    if (!canEdit) {
      setError('Você só pode editar tags de conversas atribuídas a você');
      return;
    }
    setError('');
    const currentTags = chat.tags || [];
    if (!currentTags.includes(tagName)) {
      try {
        await onUpdateTags([...currentTags, tagName]);
      } catch (e: any) {
        setError(e.message || 'Erro ao adicionar tag');
      }
    }
    setShowTagMenu(false);
  };

  const handleRemoveTag = async (tagName: string) => {
    if (!canEdit) {
      setError('Você só pode editar tags de conversas atribuídas a você');
      return;
    }
    setError('');
    const currentTags = chat.tags || [];
    try {
      await onUpdateTags(currentTags.filter((t) => t !== tagName));
    } catch (e: any) {
      setError(e.message || 'Erro ao remover tag');
    }
  };

  const handleStageChange = async (stage: string) => {
    if (!canEdit) {
      setError('Você só pode editar estágios de conversas atribuídas a você');
      return;
    }
    setError('');
    try {
      await onUpdateStage(stage);
    } catch (e: any) {
      setError(e.message || 'Erro ao atualizar estágio');
    }
  };

  const getTagColor = (tagName: string) => {
    const tag = AVAILABLE_TAGS.find((t) => t.name === tagName);
    return tag ? tag.color : '#9CA3AF';
  };

  return (
    <div className="w-[300px] bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-y-auto">
      <div className="flex justify-between items-center p-5 border-b border-zinc-800">
        <h2 className="font-bold text-white">Info do Contato</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">
          ×
        </button>
      </div>

      <div className="p-6 flex flex-col items-center border-b border-zinc-800">
        {loadingContact ? (
          <div className="w-24 h-24 rounded-full bg-zinc-800 animate-pulse mb-4" />
        ) : contactInfo?.profilePicUrl ? (
          <img
            src={contactInfo.profilePicUrl}
            alt={contactInfo.name || 'Contato'}
            className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-zinc-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-3xl font-bold text-white mb-4 ${contactInfo?.profilePicUrl ? 'hidden' : ''}`}>
          {(contactInfo?.name || chat.name || chat.id).charAt(0).toUpperCase()}
        </div>
        <h3 className="text-xl font-bold text-white mb-1">{contactInfo?.name || chat.name || chat.id}</h3>
        {contactInfo?.number && (
          <span className="text-zinc-400 text-sm mb-1">{contactInfo.number}</span>
        )}
        {contactInfo?.isBusiness && (
          <span className="text-xs bg-blue-950 text-blue-300 px-2 py-1 rounded mt-1">Negócio</span>
        )}
      </div>

      {/* Informações do Contato */}
      {contactInfo && (
        <div className="p-5 border-b border-zinc-800">
          <label className="text-xs text-zinc-500 uppercase font-semibold mb-3 block">Informações</label>
          <div className="space-y-3 text-sm">
            {contactInfo.number && (
              <div>
                <span className="text-zinc-400">Número:</span>
                <span className="text-white ml-2 font-mono">{contactInfo.number}</span>
              </div>
            )}
            {contactInfo.messageCount > 0 && (
              <div>
                <span className="text-zinc-400">Mensagens:</span>
                <span className="text-white ml-2">{contactInfo.messageCount}</span>
              </div>
            )}
            {contactInfo.firstMessageDate && (
              <div>
                <span className="text-zinc-400">Primeiro contato:</span>
                <span className="text-white ml-2">
                  {new Date(contactInfo.firstMessageDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            {contactInfo.lastMessageDate && (
              <div>
                <span className="text-zinc-400">Última mensagem:</span>
                <span className="text-white ml-2">
                  {new Date(contactInfo.lastMessageDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mx-5 mt-4 p-3 bg-red-950/40 border border-red-700 text-red-200 rounded text-sm">
          {error}
        </div>
      )}

      {!canEdit && (
        <div className="mx-5 mt-4 p-3 bg-yellow-950/40 border border-yellow-700 text-yellow-200 rounded text-sm">
          ⚠️ Esta conversa pertence a outro usuário. Apenas administradores podem editar.
        </div>
      )}

      <div className="p-5 border-b border-zinc-800">
        <label className="text-xs text-zinc-500 uppercase font-semibold mb-3 block">Estágio do Funil</label>
        <select
          value={chat.stage || 'Entrada'}
          onChange={(e) => handleStageChange(e.target.value)}
          disabled={!canEdit}
          className={`w-full bg-zinc-950 text-white border border-zinc-800 rounded-lg p-3 appearance-none focus:outline-none focus:border-yellow-400 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {FUNNEL_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
        <div className="flex gap-1 mt-3">
          {FUNNEL_STAGES.map((stage, index) => (
            <div
              key={stage}
              className={`h-1 flex-1 rounded-full ${index <= activeStageIndex ? 'bg-yellow-400' : 'bg-zinc-700'}`}
              title={stage}
            />
          ))}
        </div>
      </div>

      <div className="p-5 border-b border-zinc-800">
        <div className="flex justify-between items-center mb-3 relative">
          <label className="text-xs text-zinc-500 uppercase font-semibold">Tags</label>
          <div className="relative">
            {canEdit && (
              <button
                onClick={() => setShowTagMenu(!showTagMenu)}
                className="text-yellow-400 text-xs hover:underline"
              >
                + Adicionar
              </button>
            )}

            {showTagMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden">
                {availableToAdd.length > 0 ? (
                  availableToAdd.map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => handleAddTag(tag.name)}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-zinc-500 italic">Nenhuma tag disponível</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(chat.tags || []).map((tagName, idx) => {
            const color = getTagColor(tagName);
            return (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                  border: `1px solid ${color}40`
                }}
              >
                {tagName}
                <button
                  onClick={() => handleRemoveTag(tagName)}
                  className="hover:text-white transition-colors"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
