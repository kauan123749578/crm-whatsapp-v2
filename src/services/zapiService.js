
const BASE_URL = 'https://api.z-api.io/instances';

// Helper para headers
const getHeaders = (token, clientToken) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (clientToken) {
        headers['Client-Token'] = clientToken;
    }
    return headers;
};

export const zapiService = {
  /**
   * Verifica o status da conexão da instância
   */
  checkConnection: async (instanceId, token, clientToken) => {
    try {
      const response = await fetch(`${BASE_URL}/${instanceId}/token/${token}/status`, {
          headers: getHeaders(token, clientToken)
      });
      const data = await response.json();
      
      // Verificações robustas de conexão
      // API pode retornar { connected: true } ou { status: 'CONNECTED' } ou similar
      const isConnected = data.connected === true || data.status === 'CONNECTED';

      return {
        connected: isConnected,
        // Se não tiver mensagem, retorna o JSON cru para debug
        message: data.message || (isConnected ? 'Conectado' : `Debug: ${JSON.stringify(data)}`)
      };
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      return { connected: false, message: error.message || 'Erro de rede ou catch genérico' };
    }
  },

  /**
   * Busca as mensagens de um chat
   */
  getChats: async (instanceId, token, clientToken) => {
    try {
      const response = await fetch(`${BASE_URL}/${instanceId}/token/${token}/chats?page=1&pageSize=20`, {
          headers: getHeaders(token, clientToken)
      });
      const data = await response.json();
      console.log('Z-API getChats response:', data); // DEBUG
      return data;
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      return [];
    }
  },

  /**
   * Busca mensagens de uma conversa específica
   */
  getMessages: async (instanceId, token, phone, clientToken, amount = 10) => {
    try {
      // Z-API usa parametro 'amount' para quantidade de mensagens
      const response = await fetch(`${BASE_URL}/${instanceId}/token/${token}/chats/${phone}/messages?page=1&amount=${amount}`, {
          headers: getHeaders(token, clientToken)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  },

  /**
   * Busca a foto de perfil de um contato
   */
  getProfilePicture: async (instanceId, token, phone, clientToken) => {
    try {
      const response = await fetch(`${BASE_URL}/${instanceId}/token/${token}/get-profile-picture?phone=${phone}`, {
          headers: getHeaders(token, clientToken)
      });
      const data = await response.json();
      // Retorna a URL da imagem ou null
      return data?.url || data?.imgUrl || null;
    } catch (error) {
      console.error('Erro ao buscar foto de perfil:', error);
      return null;
    }
  },

  /**
   * Envia uma mensagem de texto simples
   */
  sendMessage: async (instanceId, token, phone, message, clientToken) => {
    try {
      const response = await fetch(`${BASE_URL}/${instanceId}/token/${token}/send-text`, {
        method: 'POST',
        headers: getHeaders(token, clientToken),
        body: JSON.stringify({
          phone: phone,
          message: message
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }
};
