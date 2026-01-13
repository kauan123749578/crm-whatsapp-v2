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
    this.readyAt = null; // timestamp quando ficou "ready" (warmup)
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
    console.log(`[${this.instanceName}] notifyStatus chamado: ${status} - ${message}`);
    console.log(`[${this.instanceName}] Callbacks registrados: ${this.statusCallbacks.length}`);
    this.statusCallbacks.forEach(cb => {
      try {
        cb({ status, message });
      } catch (error) {
        console.error(`[${this.instanceName}] Erro ao executar callback de status:`, error);
      }
    });
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
          // Evita "Runtime.callFunctionOn timed out" em ambientes lentos (Railway)
          protocolTimeout: 120000,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
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
          this.isInitialized = true;
          this.readyAt = Date.now();
          this.notifyStatus('ready', 'Conectado e pronto');
          console.log(`[${this.instanceName}] Status atualizado para 'ready'`);
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
      // Se currentStatus é 'ready', está pronto
      if (this.currentStatus === 'ready') {
        return true;
      }
      
      if (!this.client) return false;
      
      // Verificar se cliente está autenticado e pronto
      const hasInfo = !!this.client.info;
      const isInit = this.isInitialized;
      
      console.log(`[${this.instanceName}] isReady check: hasClient=${!!this.client}, hasInfo=${hasInfo}, isInit=${isInit}, currentStatus=${this.currentStatus}`);
      
      return hasInfo && isInit;
    } catch (error) {
      console.error(`[${this.instanceName}] Erro ao verificar isReady:`, error);
      // Se currentStatus é 'ready', mesmo com erro, está pronto
      return this.currentStatus === 'ready';
    }
  }

  async getChats() {
    if (!this.client) {
      throw new Error('Cliente não inicializado');
    }

    // Warmup: logo após ficar ready o Chromium ainda pode estar instável em Railway.
    // Em vez de retornar 503 e exigir retry do frontend, aguardamos um pouco aqui.
    if (this.readyAt) {
      const elapsed = Date.now() - this.readyAt;
      const warmupMs = 8000;
      if (elapsed < warmupMs) {
        const remaining = Math.min(warmupMs - elapsed, 12000);
        await new Promise((r) => setTimeout(r, remaining));
      }
    }

    // Verificar se está pronto antes de buscar chats
    const ready = await this.isReady();
    if (!ready) {
      throw new Error('Cliente não está pronto. Aguarde a conexão.');
    }

    const mapChats = (chats) =>
      chats.map((chat) => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount || 0,
        lastMessage: chat.lastMessage?.body || '',
        timestamp: chat.lastMessage?.timestamp || 0
      }));

    const attemptGetChats = async () => {
      const chats = await this.client.getChats();
      return mapChats(chats);
    };

    try {
      return await attemptGetChats();
    } catch (error) {
      console.error(`[${this.instanceName}] Erro ao buscar chats:`, error);
      const msg = String(error?.message || '');

      // Timeout do protocolo do Puppeteer: transitório em ambiente lento -> retry curto
      if (/timed out|protocolTimeout/i.test(msg)) {
        await new Promise((r) => setTimeout(r, 2500));
        return await attemptGetChats();
      }

      // Se o Chromium/Puppeteer caiu, "isReady" pode estar desatualizado.
      // Resetar estado e pedir para tentar novamente (evita 500 no frontend).
      if (/Target closed|Protocol error|Execution context|Session closed/i.test(msg)) {
        this.isInitialized = false;
        this.currentStatus = 'disconnected';
        try {
          await this.destroy();
        } catch {
          // ignore
        }
        this.notifyStatus('disconnected', 'Sessão do navegador reiniciando. Tente novamente.');
        throw new Error('Instância reiniciando. Aguarde alguns segundos e tente novamente.');
      }

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




