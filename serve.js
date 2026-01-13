// Servidor simples para servir arquivos estáticos do build
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;
const HOST = '0.0.0.0'; // Aceita conexões externas (necessário para Railway)

const distPath = join(__dirname, 'dist');

// Servir arquivos estáticos da pasta dist
app.use(express.static(distPath, { 
  index: false, // Não servir index.html automaticamente
  fallthrough: true // Permitir que o middleware continue se arquivo não for encontrado
}));

// Catch-all middleware para SPA (compatível com Express 4 e 5)
// Sem usar padrões de rota problemáticos como '*' ou '/*'
app.use((req, res, next) => {
  // Se já foi respondido (arquivo estático encontrado), não faz nada
  if (res.headersSent) {
    return next();
  }
  
  // Retorna index.html para qualquer rota não encontrada (SPA routing)
  const indexPath = join(distPath, 'index.html');
  
  if (existsSync(indexPath)) {
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Erro ao enviar index.html:', err);
        next(err);
      }
    });
  } else {
    res.status(404).send('Arquivo não encontrado. Execute "npm run build" primeiro.');
  }
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Frontend rodando em http://${HOST}:${PORT}`);
  console.log(`📦 Servindo arquivos de: ${distPath}`);
});
