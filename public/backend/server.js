import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import whatsappRoutes from './routes/whatsapp.js';
import {
  getOrCreateInstance,
  getInstance
} from './services/instanceManager.js';

const app = express();
const httpServer = createServer(app);

// Configurar CORS - Permitir todas as origens em produção
app.use(cors({
  origin: true, // Permite todas as origens
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/whatsapp', whatsappRoutes);

// Configurar Socket.IO - Permitir todas as origens
const io = new Server(httpServer, {
  cors: {
    origin: true, // Permite todas as origens
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Gerenciar conexões Socket.IO
const instanceSockets = new Map(); // instanceName -> Set de socketIds

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Cliente solicita conectar a uma instância
  socket.on('connect-instance', async ({ instanceName }) => {
    try {
      console.log(`[Socket] ${socket.id} conectando à instância: ${instanceName}`);
      
      // Adicionar socket ao grupo da instância
      socket.join(`instance:${instanceName}`);
      
      if (!instanceSockets.has(instanceName)) {
        instanceSockets.set(instanceName, new Set());
      }
      instanceSockets.get(instanceName).add(socket.id);

      // Obter ou criar instância
      let instance = getInstance(instanceName);
      
      if (!instance) {
        // Criar instância se não existir
        instance = await getOrCreateInstance(instanceName);
        
        // Registrar callbacks apenas quando criar a instância (apenas uma vez)
        instance.onQRCode((qr) => {
          io.to(`instance:${instanceName}`).emit('qr-code', {
            instanceName,
            qr
          });
        });

        instance.onStatusChange((status) => {
          io.to(`instance:${instanceName}`).emit('status-change', {
            instanceName,
            ...status
          });
        });

        instance.onMessage((message) => {
          io.to(`instance:${instanceName}`).emit('new-message', {
            instanceName,
            message
          });
        });
      }

      // Registrar callbacks se instância já existe mas callbacks não foram registrados
      if (instance && !instance.qrCodeCallbacks.length) {
        instance.onQRCode((qr) => {
          io.to(`instance:${instanceName}`).emit('qr-code', {
            instanceName,
            qr
          });
        });

        instance.onStatusChange((status) => {
          io.to(`instance:${instanceName}`).emit('status-change', {
            instanceName,
            ...status
          });
        });

        instance.onMessage((message) => {
          io.to(`instance:${instanceName}`).emit('new-message', {
            instanceName,
            message
          });
        });
      }

      // Enviar status atual
      const isReady = await instance.isReady();
      socket.emit('status-change', {
        instanceName,
        status: isReady ? 'ready' : 'waiting',
        message: isReady ? 'Conectado e pronto' : 'Aguardando conexão'
      });

      socket.emit('connected-instance', {
        instanceName,
        success: true
      });
    } catch (error) {
      console.error(`[Socket] Erro ao conectar instância ${instanceName}:`, error);
      socket.emit('error', {
        instanceName,
        message: error.message
      });
    }
  });

  // Cliente solicita criar/inicializar instância
  socket.on('initialize-instance', async ({ instanceName }) => {
    try {
      console.log(`[Socket] ${socket.id} inicializando instância: ${instanceName}`);
      
      // Verificar se já existe
      let instance = getInstance(instanceName);
      
      if (!instance) {
        // Criar apenas se não existir
        instance = await getOrCreateInstance(instanceName);
        
        // Registrar callbacks apenas uma vez quando criar
        instance.onQRCode((qr) => {
          io.to(`instance:${instanceName}`).emit('qr-code', {
            instanceName,
            qr
          });
        });

        instance.onStatusChange((status) => {
          io.to(`instance:${instanceName}`).emit('status-change', {
            instanceName,
            ...status
          });
        });

        instance.onMessage((message) => {
          io.to(`instance:${instanceName}`).emit('new-message', {
            instanceName,
            message
          });
        });
      }
      
      // Adicionar socket ao grupo
      socket.join(`instance:${instanceName}`);
      
      if (!instanceSockets.has(instanceName)) {
        instanceSockets.set(instanceName, new Set());
      }
      instanceSockets.get(instanceName).add(socket.id);

      socket.emit('instance-initialized', {
        instanceName,
        success: true
      });
    } catch (error) {
      console.error(`[Socket] Erro ao inicializar instância:`, error);
      socket.emit('error', {
        message: error.message
      });
    }
  });

  // Cliente desconecta de uma instância
  socket.on('disconnect-instance', ({ instanceName }) => {
    socket.leave(`instance:${instanceName}`);
    if (instanceSockets.has(instanceName)) {
      instanceSockets.get(instanceName).delete(socket.id);
    }
    console.log(`[Socket] ${socket.id} desconectou da instância: ${instanceName}`);
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    
    // Remover de todos os grupos
    instanceSockets.forEach((socketIds, instanceName) => {
      socketIds.delete(socket.id);
    });
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor', 
    message: err.message 
  });
});

// Capturar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const PORT = parseInt(process.env.PORT) || 3001;
const HOST = '0.0.0.0'; // Aceita conexões externas (necessário para Railway)

// Tratar erro de porta em uso
httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`📡 WebSocket disponível em ws://${HOST}:${PORT}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS: Permitindo todas as origens`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Erro: Porta ${PORT} já está em uso. Aguardando 5 segundos...`);
    setTimeout(() => {
      console.log(`🔄 Tentando novamente...`);
      process.exit(1); // Sair e deixar Railway reiniciar
    }, 5000);
  } else {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  httpServer.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});


