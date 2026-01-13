import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, ListFilter, GripVertical, ChevronUp, ChevronDown, Smartphone, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { whatsappWebService } from '../services/whatsappWebService';
import QRCodeViewer from './QRCodeViewer';

const SettingsView = ({
    availableTags, onAddTag, onDeleteTag,
    funnelStages, onAddStage, onUpdateStage, onDeleteStage, onReorderStage,
    socket,
    onWhatsAppStatusChange
}) => {
    const [newTagName, setNewTagName] = useState('');
    const [newStageName, setNewStageName] = useState('');

    // WhatsApp Web.js Configuration State
    const [connectionStatus, setConnectionStatus] = useState({
        wa1: { status: 'idle', message: '' },
        wa2: { status: 'idle', message: '' },
        wa3: { status: 'idle', message: '' }
    });

    const [qrInstance, setQrInstance] = useState(null); // Instância para mostrar QR Code

    // Atualizar status quando recebe eventos do Socket
    useEffect(() => {
        if (!socket) return;

        const handleStatusChange = (data) => {
            console.log('📡 [SettingsView] Recebeu status-change:', data);
            if (data.instanceName && ['wa1', 'wa2', 'wa3'].includes(data.instanceName)) {
                const newStatus = data.status || 'waiting';
                const newMessage = data.message || 'Aguardando...';
                
                console.log(`✅ [SettingsView] Atualizando status de ${data.instanceName}: ${newStatus} - ${newMessage}`);
                
                setConnectionStatus(prev => ({
                    ...prev,
                    [data.instanceName]: {
                        status: newStatus,
                        message: newMessage
                    }
                }));

                // Informar o App (para destravar carregamento de chats mesmo estando na tela Settings)
                if (typeof onWhatsAppStatusChange === 'function') {
                    onWhatsAppStatusChange({
                        instanceName: data.instanceName,
                        status: newStatus,
                        message: newMessage
                    });
                }
            }
        };

        socket.on('status-change', handleStatusChange);

        return () => {
            socket.off('status-change', handleStatusChange);
        };
    }, [socket, onWhatsAppStatusChange]);

    const checkConnection = async (instanceName) => {
        setConnectionStatus(prev => ({
            ...prev,
            [instanceName]: { status: 'loading', message: 'Verificando...' }
        }));

        try {
            const result = await whatsappWebService.checkConnection(instanceName);
            
            setConnectionStatus(prev => ({
                ...prev,
                [instanceName]: { 
                    status: result.connected ? 'success' : 'error',
                    message: result.message
                }
            }));
        } catch (error) {
            setConnectionStatus(prev => ({
                ...prev,
                [instanceName]: { status: 'error', message: 'Erro ao verificar conexão' }
            }));
        }
    };

    const initializeInstance = async (instanceName) => {
        if (!socket) {
            alert('WebSocket não conectado. Aguarde alguns segundos e tente novamente.');
            return;
        }

        // Se já estamos em modo QR, não reinicializar (isso só gera QR/status repetidos).
        // Apenas abrir o modal do QR e garantir que o socket está conectado ao room.
        const current = connectionStatus?.[instanceName]?.status;
        if (current === 'qr') {
            socket.emit('connect-instance', { instanceName });
            setQrInstance(instanceName);
            return;
        }

        try {
            setConnectionStatus(prev => ({
                ...prev,
                [instanceName]: { status: 'loading', message: 'Inicializando...' }
            }));

            // Inicialização deve ser feita APENAS via Socket.IO para evitar duplicidade
            // (REST + Socket ao mesmo tempo causa "The browser is already running...").
            socket.emit('initialize-instance', { instanceName });
            
            // Mostrar QR Code
            setQrInstance(instanceName);
        } catch (error) {
            setConnectionStatus(prev => ({
                ...prev,
                [instanceName]: { status: 'error', message: error.message || 'Erro ao inicializar' }
            }));
        }
    };

    const handleCreateTag = (e) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        onAddTag(newTagName.trim());
        setNewTagName('');
    };

    const handleCreateStage = (e) => {
        e.preventDefault();
        if (!newStageName.trim()) return;
        onAddStage(newStageName.trim());
        setNewStageName('');
    };

    return (
        <div className="flex-1 h-full bg-[#121212] flex flex-col items-center pt-10 text-white overflow-y-auto">
            <div className="w-full max-w-3xl p-6 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Configurações</h1>
                    <p className="text-gray-400">Gerencie suas preferências, conexões e funil de vendas.</p>
                </div>

                {/* WhatsApp Web.js Configuration Section */}
                <div className="bg-[#1E1E1E] rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Smartphone className="text-green-500" />
                            Conexões WhatsApp (whatsapp-web.js)
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Conecte suas instâncias de WhatsApp escaneando o QR Code.</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Instance Configuration */}
                        {['wa1', 'wa2', 'wa3'].map((instance, index) => {
                            const status = connectionStatus[instance].status;
                            const isConnected = status === 'success' || status === 'ready';
                            
                            return (
                                <div key={instance} className="bg-black/30 p-4 rounded-lg border border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded">WA {index + 1}</span>
                                            WhatsApp {index + 1}
                                        </h3>
                                        
                                        {status !== 'idle' && (
                                            <span className={`text-xs flex items-center gap-1 ${
                                                isConnected ? 'text-green-400' :
                                                status === 'loading' || status === 'waiting' ? 'text-yellow-400' : 
                                                status === 'qr' ? 'text-blue-400' : 'text-red-400'
                                            }`}>
                                                {isConnected ? <CheckCircle size={14} /> :
                                                 status === 'loading' || status === 'waiting' ? <RefreshCw size={14} className="animate-spin" /> : 
                                                 status === 'qr' ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                                                {connectionStatus[instance].message}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => initializeInstance(instance)}
                                            disabled={!socket || status === 'loading'}
                                            className="flex-1 bg-accent text-black font-medium px-4 py-2 rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {status === 'idle' ? 'Conectar' : 
                                             status === 'loading' ? 'Conectando...' : 
                                             status === 'qr' ? 'Mostrar QR Code' : 
                                             isConnected ? 'Reconectar' : 'Conectar'}
                                        </button>
                                        {isConnected && (
                                            <button
                                                onClick={() => checkConnection(instance)}
                                                disabled={status === 'loading'}
                                                className="bg-white/10 hover:bg-white/20 text-white rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                Verificar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* QR Code Viewer Modal */}
                {qrInstance && socket && (
                    <QRCodeViewer
                        instanceName={qrInstance}
                        onClose={() => setQrInstance(null)}
                        socket={socket}
                    />
                )}

                {/* Funnel Management Section */}
                <div className="bg-[#1E1E1E] rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ListFilter className="text-accent" />
                            Gestão do Funil
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Personalize os estágios do seu pipeline de vendas.</p>
                    </div>

                    <div className="p-6">
                        {/* Stage List */}
                        <div className="space-y-3 mb-6">
                            {funnelStages && funnelStages.map((stage, index) => (
                                <div key={stage.id} className="flex items-center gap-3 bg-black/30 p-3 rounded-lg border border-white/5 group hover:border-white/20 transition-all">
                                    <div className="text-gray-600 cursor-grab">
                                        <GripVertical size={20} />
                                    </div>

                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={stage.name}
                                            onChange={(e) => onUpdateStage(stage.id, e.target.value)}
                                            className="bg-transparent text-white font-medium w-full focus:outline-none focus:border-b focus:border-accent"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <div className="flex flex-col gap-1 mr-2">
                                            <button
                                                onClick={() => onReorderStage(index, 'up')}
                                                disabled={index === 0}
                                                className="text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => onReorderStage(index, 'down')}
                                                disabled={index === funnelStages.length - 1}
                                                className="text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => onDeleteStage(stage.id)}
                                            className="text-gray-500 hover:text-red-500 p-2 rounded-md hover:bg-white/5"
                                            title="Excluir estágio"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Stage Form */}
                        <form onSubmit={handleCreateStage} className="flex gap-4">
                            <input
                                type="text"
                                value={newStageName}
                                onChange={(e) => setNewStageName(e.target.value)}
                                placeholder="Nome do novo estágio..."
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent text-white"
                            />
                            <button
                                type="submit"
                                disabled={!newStageName.trim()}
                                className="bg-white/10 text-white font-bold px-6 py-3 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Adicionar
                            </button>
                        </form>
                    </div>
                </div>

                {/* Tag Management Section */}
                <div className="bg-[#1E1E1E] rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Tag className="text-accent" />
                            Gestão de Tags
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Crie e gerencie tags para seus leads.</p>
                    </div>

                    <div className="p-6">
                        {/* Create New Tag */}
                        <form onSubmit={handleCreateTag} className="flex gap-4 mb-8">
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Nome da nova tag..."
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent text-white"
                            />
                            <button
                                type="submit"
                                disabled={!newTagName.trim()}
                                className="bg-accent text-black font-bold px-6 py-3 rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Criar Tag
                            </button>
                        </form>

                        {/* Tag List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">Tags Disponíveis</h3>

                            {availableTags.length === 0 ? (
                                <p className="text-gray-500 italic">Nenhuma tag criada ainda.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {availableTags.map((tag) => (
                                        <div
                                            key={tag.id}
                                            className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-lg group hover:border-white/20 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full shadow-[0_0_8px]"
                                                    style={{ backgroundColor: tag.color, boxShadow: `0 0 8px ${tag.color}` }}
                                                />
                                                <span className="font-medium">{tag.name}</span>
                                            </div>

                                            <button
                                                onClick={() => onDeleteTag(tag.id)}
                                                className="text-gray-500 hover:text-red-500 p-2 rounded-md hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete tag"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
