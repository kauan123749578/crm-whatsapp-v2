const getHeaders = (token) => {
    return {
        'apikey': token,
        'Content-Type': 'application/json'
    };
};

export const uazapiService = {
  /**
   * Verifica o status da instância
   */
  checkInstanceStatus: async (baseUrl, instanceToken) => {
    try {
      console.log('🔍 Checking UAZApi status:', { baseUrl, token: instanceToken.substring(0, 10) + '...' });
      
      const response = await fetch(`${baseUrl}/instance/status`, {
          headers: getHeaders(instanceToken)
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      // UAZApi retorna { state: "connected" } ou { state: "disconnected" }
      const isConnected = data.state === 'connected';

      return {
        connected: isConnected,
        message: isConnected ? 'Conectado!' : `Status: ${data.state || 'Desconectado'}`
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return { connected: false, message: error.message || 'Erro de conexão' };
    }
  },

  /**
   * Busca lista de chats
   */
  getChats: async (baseUrl, instanceToken) => {
    try {
      // Tentar primeiro o endpoint /chats
      let response = await fetch(`${baseUrl}/chats`, {
          method: 'GET',
          headers: getHeaders(instanceToken)
      });
      
      // Se 404, tentar /chat/list
      if (response.status === 404) {
          response = await fetch(`${baseUrl}/chat/list`, {
              method: 'GET',
              headers: getHeaders(instanceToken)
          });
      }
      
      const data = await response.json();
      console.log('📋 getChats response:', data);
      return data.chats || data.data || data || [];
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      return [];
    }
  },

  /**
   * Busca mensagens de um chat específico
   */
  getMessages: async (baseUrl, instanceToken, chatId, limit = 50) => {
    try {
      const response = await fetch(`${baseUrl}/chats/messages`, {
          method: 'POST',
          headers: getHeaders(instanceToken),
          body: JSON.stringify({
              chatId: chatId,
              limit: limit
          })
      });
      const data = await response.json();
      return data.messages || data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  },

  /**
   * Busca a foto de perfil de um contato
   */
  getProfilePicture: async (baseUrl, instanceToken, chatId) => {
    try {
      const response = await fetch(`${baseUrl}/contacts/profile-picture`, {
          method: 'POST',
          headers: getHeaders(instanceToken),
          body: JSON.stringify({
              chatId: chatId
          })
      });
      const data = await response.json();
      return data?.url || data?.profilePictureUrl || null;
    } catch (error) {
      console.error('Erro ao buscar foto de perfils:', error);
      return null;
    }
  },

  /**
   * Envia uma mensagem de texto
   */
  sendText: async (baseUrl, instanceToken, chatId, text) => {
    try {
      const response = await fetch(`${baseUrl}/messages/text`, {
        method: 'POST',
        headers: getHeaders(instanceToken),
        body: JSON.stringify({
          chatId: chatId,
          text: text
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
