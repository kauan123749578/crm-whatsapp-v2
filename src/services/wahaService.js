
const getHeaders = (apiKey) => {
    return {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
    };
};

export const wahaService = {
  /**
   * Verifica o status da sessão
   */
  checkSessionStatus: async (baseUrl, apiKey, sessionName) => {
    try {
      const response = await fetch(`${baseUrl}/api/sessions/${sessionName}`, {
          headers: getHeaders(apiKey)
      });
      const data = await response.json();
      
      // WAHA retorna { name: "default", status: "WORKING" }
      const isConnected = data.status === 'WORKING';

      return {
        connected: isConnected,
        message: isConnected ? 'Conectado!' : `Status: ${data.status || 'Desconhecido'}`
      };
    } catch (error) {
      console.error('Erro ao verificar status da sessão:', error);
      return { connected: false, message: error.message || 'Erro de conexão' };
    }
  },

  /**
   * Busca lista de chats
   */
  getChats: async (baseUrl, apiKey, sessionName) => {
    try {
      const response = await fetch(`${baseUrl}/api/${sessionName}/chats`, {
          headers: getHeaders(apiKey)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      return [];
    }
  },

  /**
   * Busca mensagens de um chat específico
   */
  getMessages: async (baseUrl, apiKey, sessionName, chatId, limit = 50) => {
    try {
      const response = await fetch(`${baseUrl}/api/${sessionName}/messages?chatId=${chatId}&limit=${limit}`, {
          headers: getHeaders(apiKey)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  },

  /**
   * Envia uma mensagem de texto
   */
  sendText: async (baseUrl, apiKey, sessionName, chatId, text) => {
    try {
      const response = await fetch(`${baseUrl}/api/sendText`, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({
          session: sessionName,
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
