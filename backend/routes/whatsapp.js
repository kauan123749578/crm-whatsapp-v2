import express from 'express';
import {
  getOrCreateInstance,
  getInstance,
  hasInstance,
  removeInstance,
  listInstances
} from '../services/instanceManager.js';

const router = express.Router();

/**
 * Lista todas as instâncias
 */
router.get('/instances', (req, res) => {
  const instances = listInstances();
  res.json({ instances });
});

/**
 * Verifica status da instância
 */
router.get('/:instanceName/status', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const instance = getInstance(instanceName);
    
    if (!instance) {
      return res.json({
        connected: false,
        ready: false,
        message: 'Instância não encontrada. Crie a instância primeiro.'
      });
    }

    const isReady = await instance.isReady();
    const info = instance.getInfo();
    
    res.json({
      connected: instance.isInitialized,
      ready: isReady,
      message: isReady ? 'Conectado e pronto' : 'Aguardando conexão',
      info: info || null
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      ready: false,
      message: error.message
    });
  }
});

/**
 * Cria/inicializa uma instância
 */
router.post('/:instanceName/initialize', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    if (hasInstance(instanceName)) {
      return res.json({
        success: true,
        message: 'Instância já existe',
        instanceName
      });
    }

    const instance = await getOrCreateInstance(instanceName);
    
    res.json({
      success: true,
      message: 'Instância criada. Aguarde o QR Code.',
      instanceName
    });
  } catch (error) {
    const msg = String(error?.message || '');
    if (/already running|browser is already running/i.test(msg)) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um navegador rodando para esta instância. Aguarde alguns segundos e tente novamente.'
      });
    }
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * Remove uma instância
 */
router.delete('/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const success = await removeInstance(instanceName);
    
    if (success) {
      res.json({
        success: true,
        message: 'Instância removida com sucesso'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Instância não encontrada'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Busca lista de chats
 */
router.get('/:instanceName/chats', async (req, res) => {
  try {
    const { instanceName } = req.params;
    console.log(`[API GET /chats] Requisição para instância: ${instanceName}`);
    
    // Importar dinamicamente para evitar circular dependency
    const { getInstance, getOrCreateInstance, listInstances } = await import('../services/instanceManager.js');
    
    // Log de instâncias disponíveis para debug
    const availableInstances = listInstances();
    console.log(`[API GET /chats] Instâncias disponíveis:`, availableInstances);
    
    let instance = getInstance(instanceName);
    
    // Se não encontrou, retornar 503 (permitindo retry do frontend) sem criar automaticamente
    if (!instance) {
      console.log(`[API GET /chats] Instância ${instanceName} não encontrada. Disponíveis: ${availableInstances.join(', ')}`);
      return res.status(503).json({
        error: 'Instância ainda não existe. Inicialize via Socket.IO (Conectar) e tente novamente em alguns segundos.'
      });
    }

    const isReady = await instance.isReady();
    console.log(`[API GET /chats] Instância ${instanceName} está pronta?`, isReady);
    
    if (!isReady) {
      return res.status(503).json({
        error: 'Instância não está pronta. Aguarde a conexão.'
      });
    }

    console.log(`[API GET /chats] Buscando chats da instância ${instanceName}...`);
    const chats = await instance.getChats();
    console.log(`[API GET /chats] Retornando ${chats?.length || 0} chats`);
    res.json(chats || []);
  } catch (error) {
    console.error(`[API GET /chats] Erro ao buscar chats para ${req.params.instanceName}:`, error);
    console.error(`[API GET /chats] Stack:`, error.stack);
    const msg = String(error?.message || '');
    if (/Instância reiniciando|Instância preparando|Instância ocupada|warmup|Target closed|Protocol error|Execution context|timed out|protocolTimeout/i.test(msg)) {
      return res.status(503).json({ error: msg });
    }
    res.status(500).json({ error: msg });
  }
});

/**
 * Busca mensagens de um chat específico
 */
router.get('/:instanceName/chats/:chatId/messages', async (req, res) => {
  try {
    const { instanceName, chatId } = req.params;
    const { limit = 50 } = req.query;
    
    const instance = getInstance(instanceName);
    if (!instance) {
      return res.status(404).json({
        error: 'Instância não encontrada'
      });
    }

    const isReady = await instance.isReady();
    if (!isReady) {
      return res.status(503).json({
        error: 'Instância não está pronta'
      });
    }

    const messages = await instance.getMessages(chatId, parseInt(limit));
    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Envia uma mensagem de texto
 */
router.post('/:instanceName/send', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { chatId, message } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({
        error: 'chatId e message são obrigatórios'
      });
    }

    const instance = getInstance(instanceName);
    if (!instance) {
      return res.status(404).json({
        error: 'Instância não encontrada'
      });
    }

    const isReady = await instance.isReady();
    if (!isReady) {
      return res.status(503).json({
        error: 'Instância não está pronta'
      });
    }

    const result = await instance.sendMessage(chatId, message);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Busca foto de perfil de um contato
 */
router.get('/:instanceName/profile/:chatId', async (req, res) => {
  try {
    const { instanceName, chatId } = req.params;
    const instance = getInstance(instanceName);
    
    if (!instance) {
      return res.status(404).json({
        error: 'Instância não encontrada'
      });
    }

    const profilePic = await instance.getProfilePicture(chatId);
    if (profilePic) {
      res.json({ url: profilePic });
    } else {
      res.json({ url: null });
    }
  } catch (error) {
    console.error('Erro ao buscar foto de perfil:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Busca informações de um contato
 */
router.get('/:instanceName/contact/:chatId', async (req, res) => {
  try {
    const { instanceName, chatId } = req.params;
    const instance = getInstance(instanceName);
    
    if (!instance) {
      return res.status(404).json({
        error: 'Instância não encontrada'
      });
    }

    const contact = await instance.getContact(chatId);
    if (contact) {
      res.json(contact);
    } else {
      res.status(404).json({
        error: 'Contato não encontrado'
      });
    }
  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;

