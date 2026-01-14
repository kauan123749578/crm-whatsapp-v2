# 🚂 Configuração Railway - JOÃO FORNECEDOR

## ⚠️ IMPORTANTE: Root Directory

No Railway, configure o **Root Directory** para: `crm-v2`

**Como fazer:**
1. Vá em **Settings** do serviço
2. Role até **Root Directory**
3. Digite: `crm-v2`
4. Salve

## 🔧 Variáveis de Ambiente

Configure estas variáveis no Railway:

### Obrigatórias:
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
```

OU (alternativa):
```
URL_DO_BANCO_DE_DADOS = ${{Postgres.DATABASE_URL}}
```

### Recomendadas:
```
JWT_SECRET = e9c50ff8c6c4fa96cabf2114ab2a0d93
NODE_ENV = production
WA_DATA_PATH = /data/wwebjs_auth
```

## 📦 Volume (Importante!)

Crie um **Volume** e monte em:
- **Mount Path:** `/data`

Isso persiste a sessão do WhatsApp entre reinicializações.

## ✅ Checklist

- [ ] Root Directory configurado para `crm-v2`
- [ ] Variável `DATABASE_URL` ou `URL_DO_BANCO_DE_DADOS` configurada
- [ ] Variável `JWT_SECRET` configurada
- [ ] Variável `NODE_ENV=production` configurada
- [ ] Variável `WA_DATA_PATH=/data/wwebjs_auth` configurada
- [ ] Volume criado e montado em `/data`
- [ ] PostgreSQL adicionado e conectado

## 🚀 Após o Deploy

O sistema criará automaticamente:
- Usuário admin: `admin` / `admin123`
- 5 usuários funcionários (veja `CREDENCIAIS.md`)

