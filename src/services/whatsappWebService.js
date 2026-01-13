import { getApiBaseUrl } from './runtimeConfig.js';

const BASE_URL = getApiBaseUrl();

export const whatsappWebService = {
  /**
   * Verifica o status da conexão da instância
   */
  checkConnection: async (instanceName) => {
    try {
      const response = await fetch(`${BASE_URL}/${instanceName}/status`);
      const data = await response.json();
      
      return {
        connected: data.ready || false,
        message: data.message || 'Desconectado'
      };
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      return { connected: false, message: error.message || 'Erro de conexão' };
    }
  },

  /**
   * Inicializa uma instância
   */
  initializeInstance: async (instanceName) => {
    try {
      const response = await fetch(`${BASE_URL}/${instanceName}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao inicializar instância:', error);
      throw error;
    }
  },

  /**
   * Busca lista de chats
   */
  getChats: async (instanceName) => {
    try {
      const response = await fetch(`${BASE_URL}/${instanceName}/chats`);
      
      if (!response.ok) {
        // 503/5xx: transitório (warmup, reinício do Puppeteer, timeout no Railway)
        if (response.status === 503 || response.status >= 500) return null;
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      // Se deu erro de rede/timeout, tratar como transitório e permitir retry no App
      return null;
    }
  },

  /**
   * Busca mensagens de uma conversa específica
   */
  getMessages: async (instanceName, chatId, limit = 50) => {
    try {
      const response = await fetch(
        `${BASE_URL}/${instanceName}/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  },

  /**
   * Busca foto de perfil de um contato
   */
  getProfilePicture: async (instanceName, chatId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/${instanceName}/profile/${encodeURIComponent(chatId)}`
      );
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.url || null;
    } catch (error) {
      console.error('Erro ao buscar foto de perfil:', error);
      return null;
    }
  },

  /**
   * Envia uma mensagem de texto
   */
  sendMessage: async (instanceName, chatId, message) => {
    try {
      const response = await fetch(`${BASE_URL}/${instanceName}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: chatId,
          message: message
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar mensagem');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }
};


