import React from 'react';
import { X, Tag, User } from 'lucide-react';

const RightSidebar = ({ contact, onClose, availableTags, onUpdateTags, funnelStages, onUpdateStage }) => {
    const [showTagMenu, setShowTagMenu] = React.useState(false);

    if (!contact) return null;

    const handleAddTag = (tagName) => {
        if (!contact.tags.includes(tagName)) {
            onUpdateTags([...contact.tags, tagName]);
        }
        setShowTagMenu(false);
    };

    const handleRemoveTag = (tagName) => {
        onUpdateTags(contact.tags.filter(t => t !== tagName));
    };

    const getTagColor = (tagName) => {
        const tag = availableTags?.find(t => t.name === tagName);
        return tag ? tag.color : '#9CA3AF'; // Default gray
    };

    const availableToAdd = availableTags?.filter(t => !contact.tags.includes(t.name)) || [];

    // Determine active stage index
    const activeStageIndex = funnelStages?.findIndex(s => s.name === contact.stage);

    return (
        <div className="w-[300px] bg-[#1E1E1E] border-l border-white/10 flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-white/10">
                <h2 className="font-bold text-white">Info do Contato</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white xl:hidden">
                    <X size={20} />
                </button>
            </div>

            {/* Profile Info */}
            <div className="p-6 flex flex-col items-center border-b border-white/10">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-xl">
                    {contact.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{contact.name}</h3>
                <span className="text-gray-400 text-sm">Online</span>
            </div>

            {/* Funnel Stage */}
            <div className="p-5 border-b border-white/10">
                <label className="text-xs text-gray-500 uppercase font-semibold mb-3 block">Estágio do Funil</label>
                <div className="relative">
                    <select
                        value={contact.stage}
                        onChange={(e) => onUpdateStage(e.target.value)}
                        className="w-full bg-[#121212] text-white border border-white/10 rounded-lg p-3 appearance-none focus:outline-none focus:border-accent"
                    >
                        {funnelStages?.map(stage => (
                            <option key={stage.id} value={stage.name}>
                                {stage.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-2 h-2 border-r border-b border-gray-400 transform rotate-45 mb-1" />
                    </div>
                </div>
                {/* Visual Indicator of stage */}
                <div className="flex gap-1 mt-3">
                    {funnelStages?.map((stage, index) => (
                        <div
                            key={stage.id}
                            className={`h-1 flex-1 rounded-full ${index <= activeStageIndex ? 'bg-accent' : 'bg-gray-700'}`}
                            title={stage.name}
                        />
                    ))}
                </div>
            </div>

            {/* Tags */}
            <div className="p-5 border-b border-white/10">
                <div className="flex justify-between items-center mb-3 relative">
                    <label className="text-xs text-gray-500 uppercase font-semibold">Tags</label>
                    <div className="relative">
                        <button
                            onClick={() => setShowTagMenu(!showTagMenu)}
                            className="text-accent text-xs hover:underline flex items-center gap-1"
                        >
                            + Adicionar
                        </button>

                        {/* Tag Dropdown */}
                        {showTagMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#2A2A2A] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                {availableToAdd.length > 0 ? (
                                    availableToAdd.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleAddTag(tag.name)}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            {tag.name}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-sm text-gray-500 italic">Nenhuma tag disponível</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {contact.tags && contact.tags.map((tagName, idx) => {
                        const color = getTagColor(tagName);
                        return (
                            <span
                                key={idx}
                                className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                                style={{
                                    backgroundColor: `${color}20`, // 20% opacity
                                    color: color,
                                    border: `1px solid ${color}40`
                                }}
                            >
                                {tagName}
                                <button
                                    onClick={() => handleRemoveTag(tagName)}
                                    className="hover:text-white transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;
