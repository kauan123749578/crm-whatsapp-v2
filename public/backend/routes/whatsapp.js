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
    res.status(500).json({
      success: false,
      message: error.message
    });
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
    const instance = getInstance(instanceName);
    
    if (!instance) {
      return res.status(404).json({
        error: 'Instância não encontrada. Inicialize primeiro.'
      });
    }

    const isReady = await instance.isReady();
    if (!isReady) {
      return res.status(503).json({
        error: 'Instância não está pronta. Aguarde a conexão.'
      });
    }

    const chats = await instance.getChats();
    res.json(chats);
  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    res.status(500).json({
      error: error.message
    });
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


