# ⚙️ Configuração Backend para Railway

## ✅ Configuração Atual

### ✅ Porta
- **Código**: Usa `process.env.PORT` (Railway define automaticamente)
- **Fallback**: 3001 (para desenvolvimento local)
- **Railway**: Atribui porta automaticamente via `$PORT`

### ✅ Node.js
- **Detecção**: Automática via `package.json`
- **Versão**: Railway detecta pelo `engines` ou usa LTS

### ✅ Inicialização
- **Procfile**: `web: npm start`
- **Script**: `npm start` → `node server.js`
- **Comando final**: `node server.js`

### ✅ Host
- **Configurado**: `0.0.0.0` (aceita conexões externas)
- **Necessário**: Para Railway conseguir conectar

---

## 📋 Checklist Railway

### Configurações no Railway:

#### 1. Root Directory
```
backend
```

#### 2. Build Command
```
(deixe vazio - Railway detecta automaticamente)
```

#### 3. Start Command
```
(deixe vazio - usa Procfile)
```
OU
```
npm start
```

#### 4. Variáveis de Ambiente
```env
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.up.railway.app
```

⚠️ **NÃO defina `PORT`** - Railway define automaticamente via `$PORT`

---

## 🔍 Como Funciona

### 1. Railway Detecta Node.js
```
Railway → Lê package.json → Detecta Node.js
```

### 2. Railway Usa Procfile
```
Railway → Procfile encontrado → web: npm start
```

### 3. npm start Executa
```
npm start → node server.js
```

### 4. Servidor Inicia
```
server.js → httpServer.listen(PORT, '0.0.0.0')
```

### 5. Railway Conecta
```
Railway → Usa porta do $PORT → Conecta em 0.0.0.0
```

---

## 📊 Fluxo Completo

```
Railway
  ↓
Detecta package.json (Node.js)
  ↓
Procfile: web: npm start
  ↓
npm start → node server.js
  ↓
const PORT = process.env.PORT (Railway define)
const HOST = '0.0.0.0' (aceita externas)
  ↓
httpServer.listen(PORT, HOST)
  ↓
Servidor rodando e acessível! ✅
```

---

## ✅ Verificação

### Logs Esperados no Railway:
```
🚀 Servidor rodando em http://0.0.0.0:XXXX
📡 WebSocket disponível em ws://0.0.0.0:XXXX
🔗 Health check: http://0.0.0.0:XXXX/health
🌐 Ambiente: production
```

### Testar Health Check:
```
https://seu-backend.up.railway.app/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## 🐛 Troubleshooting

### ❌ Servidor não inicia
**Verificar**:
- [ ] Procfile existe
- [ ] package.json tem script `start`
- [ ] Logs no Railway

### ❌ Não aceita conexões
**Verificar**:
- [ ] Host está configurado como `0.0.0.0`
- [ ] Porta usa `process.env.PORT`

### ❌ Porta errada
**Verificar**:
- [ ] Não definiu `PORT` manualmente nas variáveis
- [ ] Railway define automaticamente via `$PORT`

---

## ✅ Tudo Configurado!

O backend está pronto para Railway! 🚀

