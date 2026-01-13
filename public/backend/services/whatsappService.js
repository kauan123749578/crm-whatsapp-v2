// whatsapp-web.js é CommonJS, precisa importar como default
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

export class WhatsAppService {
  constructor(instanceName) {
    this.instanceName = instanceName;
    this.client = null;
    this.qrCodeCallbacks = [];
    this.statusCallbacks = [];
    this.messageCallbacks = [];
    this.isInitialized = false;
    this.eventListenersRegistered = false; // Flag para evitar registrar eventos múltiplas vezes
    this.currentQR = null; // Armazena o QR Code atual
    this.currentStatus = 'waiting'; // Armazena o status atual
  }

  // Registrar callbacks para eventos
  onQRCode(callback) {
    this.qrCodeCallbacks.push(callback);
    
    // Se já tem QR Code, enviar imediatamente para o novo callback
    if (this.currentQR) {
      callback(this.currentQR);
    }
  }

  onStatusChange(callback) {
    this.statusCallbacks.push(callback);
    
    // Se já tem status, enviar imediatamente para o novo callback
    if (this.currentStatus !== 'waiting') {
      callback({ status: this.currentStatus, message: 'Status atual' });
    }
  }

  onMessage(callback) {
    this.messageCallbacks.push(callback);
  }

  // Notificar todos os callbacks
  notifyQRCode(qr) {
    this.currentQR = qr; // Armazenar QR atual
    this.qrCodeCallbacks.forEach(cb => cb(qr));
  }

  notifyStatus(status, message) {
    this.currentStatus = status; // Armazenar status atual
    this.statusCallbacks.forEach(cb => cb({ status, message }));
  }

  notifyMessage(message) {
    this.messageCallbacks.forEach(cb => cb(message));
  }

  async initialize() {
    if (this.isInitialized && this.client) {
      return;
    }

    try {
      // Se já tem client mas não está inicializado, não criar novo
      if (this.client && !this.isInitialized) {
        await this.client.initialize();
        return;
      }

      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: this.instanceName // Salva sessão por instância
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      // Registrar eventos apenas uma vez
      if (!this.eventListenersRegistered) {
        // Evento: QR Code gerado
        this.client.on('qr', (qr) => {
          console.log(`[${this.instanceName}] QR Code gerado`);
          qrcode.generate(qr, { small: true });
          this.notifyQRCode(qr);
          this.notifyStatus('qr', 'Escaneie o QR Code');
        });

        // Evento: Autenticado e pronto
        this.client.on('ready', () => {
          console.log(`[${this.instanceName}] Cliente pronto!`);
          this.notifyStatus('ready', 'Conectado e pronto');
          this.isInitialized = true;
        });

        // Evento: Autenticação completa
        this.client.on('authenticated', () => {
          console.log(`[${this.instanceName}] Autenticado`);
          this.notifyStatus('authenticated', 'Autenticado com sucesso');
        });

        // Evento: Falha na autenticação
        this.client.on('auth_failure', (msg) => {
          console.error(`[${this.instanceName}] Falha na autenticação:`, msg);
          this.notifyStatus('auth_failure', 'Falha na autenticação');
        });

        // Evento: Desconectado
        this.client.on('disconnected', (reason) => {
          console.log(`[${this.instanceName}] Desconectado:`, reason);
          this.notifyStatus('disconnected', 'Desconectado');
          this.isInitialized = false;
        });

        // Evento: Mensagem recebida
        this.client.on('message', async (msg) => {
        try {
          const chat = await msg.getChat();
          const contact = await msg.getContact();
          
          const messageData = {
            id: msg.id._serialized,
            body: msg.body,
            from: msg.from,
            to: msg.to,
            timestamp: msg.timestamp,
            fromMe: msg.fromMe,
            chatId: chat.id._serialized,
            chatName: chat.name,
            author: contact.name || msg.from,
            hasMedia: msg.hasMedia,
            type: msg.type
          };

          // Se tiver mídia, tentar obter
          if (msg.hasMedia) {
            try {
              const media = await msg.downloadMedia();
              messageData.media = {
                mimetype: media.mimetype,
                data: media.data,
                filename: media.filename
              };
            } catch (error) {
              console.error('Erro ao baixar mídia:', error);
            }
          }

            this.notifyMessage(messageData);
          } catch (error) {
            console.error('Erro ao processar mensagem:', error);
          }
        });

        // Evento: Mudança no status da conexão
        this.client.on('change_state', (state) => {
          console.log(`[${this.instanceName}] Estado mudou:`, state);
          this.notifyStatus('state_change', `Estado: ${state}`);
        });

        this.eventListenersRegistered = true;
      }

      // Inicializar cliente
      await this.client.initialize();
    } catch (error) {
      console.error(`[${this.instanceName}] Erro ao inicializar:`, error);
      this.notifyStatus('error', `Erro: ${error.message}`);
      throw error;
    }
  }

  async destroy() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isInitialized = false;
    }
  }

  async isReady() {
    try {
      if (!this.client) return false;
      // Verificar se cliente está autenticado e pronto
      return this.client.info && this.isInitialized;
    } catch (error) {
      return false;
    }
  }

  async getChats() {
    if (!this.client) {
      throw new Error('Cliente não inicializado');
    }

    // Verificar se está pronto antes de buscar chats
    const ready = await this.isReady();
    if (!ready) {
      throw new Error('Cliente não está pronto. Aguarde a conexão.');
    }

    try {
      const chats = await this.client.getChats();
      return chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount || 0,
        lastMessage: chat.lastMessage?.body || '',
        timestamp: chat.lastMessage?.timestamp || 0
      }));
    } catch (error) {
      console.error(`[${this.instanceName}] Erro ao buscar chats:`, error);
      throw error;
    }
  }

  async getMessages(chatId, limit = 50) {
    if (!this.client) {
      throw new Error('Cliente não inicializado');
    }

    try {
      const chat = await this.client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit });
      
      return messages.map(msg => ({
        id: msg.id._serialized,
        text: msg.body || '[Mídia]',
        time: new Date(msg.timestamp * 1000).toISOString(),
        timestamp: msg.timestamp,
        sender: msg.fromMe ? 'me' : 'them',
        fromMe: msg.fromMe,
        from: msg.from,
        type: msg.type,
        hasMedia: msg.hasMedia
      }));
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
  }

  async sendMessage(chatId, message) {
    if (!this.client) {
      throw new Error('Cliente não inicializado');
    }

    try {
      const result = await this.client.sendMessage(chatId, message);
      return {
        id: result.id._serialized,
        success: true
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async getProfilePicture(chatId) {
    if (!this.client) {
      return null;
    }

    try {
      const profilePicUrl = await this.client.getProfilePicUrl(chatId);
      return profilePicUrl;
    } catch (error) {
      // Se não tiver foto ou erro, retorna null
      return null;
    }
  }

  async getContact(chatId) {
    if (!this.client) {
      return null;
    }

    try {
      const contact = await this.client.getContactById(chatId);
      return {
        id: contact.id._serialized,
        name: contact.name || contact.pushname || chatId,
        number: contact.number,
        isBusiness: contact.isBusiness,
        isUser: contact.isUser,
        isGroup: contact.isGroup
      };
    } catch (error) {
      return null;
    }
  }

  getInfo() {
    if (!this.client?.info) {
      return null;
    }

    return {
      wid: this.client.info.wid._serialized,
      pushname: this.client.info.pushname,
      platform: this.client.info.platform
    };
  }
}


