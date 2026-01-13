# 🚀 CRM WhatsApp v2

Sistema completo de CRM para WhatsApp com autenticação, funil de vendas, tags e gestão de equipe.

## 📋 Sobre o Projeto

Este CRM permite:
- ✅ Gerenciar conversas do WhatsApp em tempo real
- ✅ Sistema de autenticação com Admin e Funcionários
- ✅ Funil de vendas (Entrada → Contatado → Negociação → Ganho/Perdido)
- ✅ Sistema de tags para organizar contatos
- ✅ Admin pode ver todas as conversas
- ✅ Funcionários só veem suas conversas atribuídas
- ✅ Atribuição automática de conversas ao editar

## 🏗️ Estrutura do Projeto

```
repositorio-pronto/
└── crm-v2/                    ← PROJETO PRINCIPAL (use este)
    ├── apps/
    │   ├── backend/          ← Backend NestJS + TypeScript
    │   │   ├── src/
    │   │   ├── prisma/       ← Schema do banco de dados
    │   │   └── public/       ← Frontend compilado servido aqui
    │   └── web/              ← Frontend React + TypeScript + Vite
    ├── package.json
    ├── nixpacks.toml         ← Configuração Railway
    └── railway.json          ← Configuração Railway
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ 
- PostgreSQL (ou use Railway para criar um banco)
- Git (para versionamento)

### 1. Instalar Dependências

```bash
cd crm-v2
npm install
```

### 2. Configurar Banco de Dados

Crie um arquivo `.env` na pasta `crm-v2/`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
WA_DATA_PATH=.wwebjs_auth
NODE_ENV=development
PORT=8080
JWT_SECRET=sua-chave-secreta-aqui
```

### 3. Inicializar Banco

```bash
npm run db:push
npm run prisma:seed -w @crm/backend
```

### 4. Rodar Localmente

```bash
npm run dev
```

Acesse: http://localhost:8080

### 5. Credenciais Padrão

Após executar o seed:

- **Admin**: `admin` / `admin123`
- **Funcionário 1**: `user1` / `user1`
- **Funcionário 2**: `user2` / `user2`
- **Funcionário 3**: `user3` / `user3`

⚠️ **IMPORTANTE**: Altere as senhas em produção!

## 📦 Setup do Repositório Git

Para colocar este projeto no GitHub:

```bash
# 1. Inicializar Git
git init
git branch -M main

# 2. Adicionar arquivos
git add .

# 3. Primeiro commit
git commit -m "feat: CRM WhatsApp v2 - Sistema completo"

# 4. Conectar ao GitHub
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git

# 5. Fazer push
git push -u origin main
```

📖 **Veja guia completo em**: [`SETUP_REPOSITORIO.md`](./SETUP_REPOSITORIO.md)

## 🚂 Deploy na Railway

### Passo a Passo Rápido

1. **Criar projeto na Railway**
   - Acesse https://railway.app
   - "New Project" → "Deploy from GitHub repo"
   - Selecione seu repositório

2. **Adicionar PostgreSQL**
   - "+ New" → "Database" → "Add PostgreSQL"
   - Railway injeta `DATABASE_URL` automaticamente

3. **Adicionar Volume** (Importante!)
   - "+ New" → "Volume"
   - Mount path: `/data`
   - Isso persiste a sessão do WhatsApp

4. **Configurar Variáveis**
   ```
   NODE_ENV=production
   WA_DATA_PATH=/data/wwebjs_auth
   JWT_SECRET=sua-chave-secreta-aqui
   ```

5. **Configurar Build**
   - Root directory: `crm-v2` (se necessário)
   - Build command: `npm run build`
   - Start command: `npm start`

6. **Inicializar Banco**
   - Após primeiro deploy, abra o Shell
   - Execute: `cd crm-v2 && npm run db:push`
   - Execute: `cd apps/backend && npm run prisma:seed`

📖 **Veja guia completo em**: [`crm-v2/RAILWAY_DEPLOY.md`](./crm-v2/RAILWAY_DEPLOY.md)

## 🛠️ Tecnologias

- **Backend**: NestJS, TypeScript, Socket.IO, Prisma ORM
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Banco**: PostgreSQL
- **WhatsApp**: whatsapp-web.js
- **Deploy**: Railway

## 📚 Documentação

- [`crm-v2/README.md`](./crm-v2/README.md) - Documentação técnica do projeto
- [`crm-v2/COMO_FUNCIONA.md`](./crm-v2/COMO_FUNCIONA.md) - Como funciona o sistema
- [`crm-v2/PERMISSOES.md`](./crm-v2/PERMISSOES.md) - Sistema de permissões
- [`crm-v2/FUNIL_VENDAS.md`](./crm-v2/FUNIL_VENDAS.md) - Funil de vendas
- [`SETUP_REPOSITORIO.md`](./SETUP_REPOSITORIO.md) - Guia de setup Git/GitHub
- [`crm-v2/RAILWAY_DEPLOY.md`](./crm-v2/RAILWAY_DEPLOY.md) - Guia completo de deploy

## ✅ Correções Implementadas

- ✅ Credenciais removidas da interface (segurança)
- ✅ Tags preservadas ao atualizar chats
- ✅ Nomes de contatos preservados (não viram código)
- ✅ Sistema de usuários funcionando
- ✅ Funil de vendas implementado
- ✅ Pronto para produção

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Roda em modo dev com watch

# Build
npm run build            # Compila tudo (backend + frontend)

# Banco de dados
npm run db:push          # Sincroniza schema com banco
npm run db:migrate       # Executa migrations
npm run prisma:seed      # Cria usuários padrão

# Produção
npm start                # Inicia servidor compilado
```

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 👤 Autor

Desenvolvido para gestão de equipes e conversas do WhatsApp.

---

**🚀 Pronto para produção!**
