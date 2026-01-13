# CRM WhatsApp (v2)

Stack (MVP):
- **Backend**: NestJS + TypeScript + Socket.IO + `whatsapp-web.js`
- **DB**: PostgreSQL via Prisma
- **Frontend**: React + TypeScript + Vite + Tailwind

### Rodar local (dev)

1) Você precisa de um Postgres. Sem Docker, o jeito mais rápido é criar **apenas o Postgres no Railway** e copiar o `DATABASE_URL`.
2) Crie um arquivo `.env` na raiz `crm-v2/` (use `env.example.txt` como modelo) e preencha `DATABASE_URL`.
3) Na raiz `crm-v2/`:

```bash
npm install
npm run db:push
npm run dev
```

### Deploy no Railway (1 serviço)

- Crie um **PostgreSQL** no Railway e conecte no serviço (vai injetar `DATABASE_URL`)
- (Recomendado) Crie um **Volume** e monte em `/data` para persistir sessão do WhatsApp
- Variáveis recomendadas:
  - `NODE_ENV=production`
  - `WA_DATA_PATH=/data/wwebjs_auth`
- Primeiro deploy:
  - Rode `db:push` uma vez (Railway: `npm run db:push`)
  - Depois `npm start`

### Endpoints

- `GET /health`
- `GET /api/instances`
- `GET /api/instances/:instanceId/chats`
- `GET /api/instances/:instanceId/chats/:chatId/messages`
- `POST /api/instances/:instanceId/send` `{ chatId, text }`

### Socket events

Servidor -> Cliente:
- `wa:qr` `{ instanceId, qr }`
- `wa:status` `{ instanceId, status, message }`
- `wa:message` `{ instanceId, message }`

Cliente -> Servidor:
- `wa:connect` `{ instanceId }`

### Notas importantes (pra não quebrar no Railway)

- **Sessão do WhatsApp precisa de disco persistente**: sem volume, ao reiniciar o container você vai ter que escanear QR de novo.
- **Memória**: Chromium/WhatsApp Web consome RAM. Se ficar reiniciando, aumente RAM do serviço.

