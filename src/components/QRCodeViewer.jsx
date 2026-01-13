import React, { useEffect, useState } from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

const QRCodeViewer = ({ instanceName, onClose, socket }) => {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('waiting'); // waiting, qr, authenticated, ready, error
  const [statusMessage, setStatusMessage] = useState('Aguardando...');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket || !instanceName) return;

    let isMounted = true;
    let qrGenerated = false;

    // Conectar à instância via Socket (apenas uma vez)
    socket.emit('connect-instance', { instanceName });

    // Listener para QR Code
    const handleQRCode = (data) => {
      if (data.instanceName === instanceName && isMounted && !qrGenerated) {
        qrGenerated = true;
        setStatus('qr');
        setStatusMessage('Escaneie o QR Code com seu WhatsApp');
        
        // Gerar imagem QR Code
        QRCode.toDataURL(data.qr, { width: 300, margin: 2 })
          .then(url => {
            if (isMounted) {
              setQrCode(url);
            }
          })
          .catch(err => {
            console.error('Erro ao gerar QR Code:', err);
            if (isMounted) {
              setQrCode(data.qr); // Fallback para texto
            }
          });
      }
    };

    // Listener para mudanças de status
    const handleStatusChange = (data) => {
      if (data.instanceName === instanceName && isMounted) {
        const newStatus = data.status || 'waiting';
        
        // Sempre atualizar o status
        setStatus(newStatus);
        setStatusMessage(data.message || 'Aguardando...');
        
        if (newStatus === 'ready') {
          // Mostrar mensagem de sucesso por 2 segundos antes de fechar
          setStatusMessage('Conectado com sucesso! Fechando...');
          setTimeout(() => {
            if (isMounted) {
              onClose();
            }
          }, 2000);
        }
        
        if (newStatus === 'error' || newStatus === 'auth_failure') {
          setError(data.message || 'Erro na autenticação');
        }
      }
    };

    // Listener para erros
    const handleError = (data) => {
      if (data.instanceName === instanceName) {
        setError(data.message || 'Erro desconhecido');
        setStatus('error');
      }
    };

    socket.on('qr-code', handleQRCode);
    socket.on('status-change', handleStatusChange);
    socket.on('error', handleError);

    return () => {
      isMounted = false;
      socket.off('qr-code', handleQRCode);
      socket.off('status-change', handleStatusChange);
      socket.off('error', handleError);
      // NÃO desconectar da instância ao fechar o modal.
      // Motivo: o backend emite 'ready' logo após 'authenticated' e, se sairmos do room,
      // o App nunca recebe 'ready' e fica preso em "Aguardando conexão...".
    };
  }, [socket, instanceName]);

  const handleReinitialize = () => {
    setStatus('waiting');
    setStatusMessage('Reinicializando...');
    setQrCode(null);
    setError(null);
    socket.emit('initialize-instance', { instanceName });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Conectar {instanceName.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Status */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm">
            {status === 'ready' && (
              <>
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-green-500">Conectado!</span>
              </>
            )}
            {status === 'qr' && (
              <>
                <RefreshCw size={16} className="text-yellow-500 animate-spin" />
                <span className="text-yellow-500">Aguardando escaneamento do QR Code</span>
              </>
            )}
            {status === 'waiting' && (
              <>
                <RefreshCw size={16} className="text-blue-500 animate-spin" />
                <span className="text-blue-500">Aguardando inicialização...</span>
              </>
            )}
            {status === 'authenticated' && (
              <>
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-green-500">QR Code escaneado! Finalizando autenticação...</span>
              </>
            )}
            {status === 'error' && (
              <>
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-red-500">Erro</span>
              </>
            )}
          </div>
        </div>

        {/* QR Code - Mostrar enquanto não estiver ready ou error */}
        {qrCode && status !== 'ready' && status !== 'error' && (
          <div className="flex flex-col items-center mb-4">
            <div className="bg-white p-4 rounded-lg mb-4">
              {qrCode.startsWith('data:image') ? (
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-xs break-all p-2">
                  {qrCode}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400 text-center">
              Abra o WhatsApp no seu celular<br />
              Toque em Menu ou Configurações e selecione<br />
              <strong>Aparelhos conectados</strong>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success */}
        {status === 'ready' && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-4">
            <p className="text-green-400 text-sm">
              ✅ Conectado com sucesso! Esta janela será fechada automaticamente.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {status === 'error' && (
            <button
              onClick={handleReinitialize}
              className="flex-1 bg-accent text-black font-medium px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Tentar Novamente
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 text-white font-medium px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            {status === 'ready' ? 'Fechar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeViewer;


