# 📦 Setup do Repositório e Deploy

## 🎯 Objetivo

Colocar o projeto CRM WhatsApp v2 no GitHub e fazer deploy na Railway.

## 📋 Projeto Principal

O projeto principal está em: **`crm-v2/`**

Este é o projeto atualizado e corrigido que vamos usar.

## 🚀 Passo a Passo

### 1. Criar Repositório no GitHub

1. Acesse https://github.com e faça login
2. Clique em **"New repository"** (ou "+" → "New repository")
3. Preencha:
   - **Repository name**: `crm-whatsapp-v2` (ou outro nome de sua escolha)
   - **Description**: "CRM WhatsApp v2 - Sistema de gestão de conversas com funil de vendas"
   - **Visibility**: Private (recomendado) ou Public
   - **NÃO** marque "Initialize with README" (já temos arquivos)
4. Clique em **"Create repository"**

### 2. Inicializar Git Localmente

Abra o terminal/PowerShell na pasta do projeto:

```bash
cd "C:\Users\kauan\Downloads\antigravity-crm\antigravity-crm\repositorio-pronto"
```

Inicialize o Git:

```bash
git init
git branch -M main
```

### 3. Adicionar Arquivos

Adicione todos os arquivos (exceto os que estão no .gitignore):

```bash
git add .
```

Verifique o que será commitado:

```bash
git status
```

### 4. Primeiro Commit

```bash
git commit -m "feat: CRM WhatsApp v2 - Sistema completo com autenticação, funil de vendas e tags"
```

### 5. Conectar ao GitHub

```bash
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
```

**⚠️ IMPORTANTE:** Substitua `SEU-USUARIO` e `SEU-REPOSITORIO` pelos seus dados reais!

Exemplo:
```bash
git remote add origin https://github.com/kauan/crm-whatsapp-v2.git
```

### 6. Fazer Push

```bash
git push -u origin main
```

Se pedir autenticação:
- Use um **Personal Access Token** (não sua senha)
- Como criar: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Permissões necessárias: `repo` (full control)

## 🚂 Deploy na Railway

Após o código estar no GitHub:

### 1. Conectar Railway ao GitHub

1. Acesse https://railway.app
2. Faça login
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Autorize o Railway a acessar seu GitHub (se necessário)
6. Selecione o repositório `crm-whatsapp-v2`

### 2. Configurar Projeto na Railway

**Root Directory:**
- Se Railway não detectar automaticamente, configure:
- Root directory: `crm-v2`

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm start
```

### 3. Adicionar PostgreSQL

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. Railway injeta `DATABASE_URL` automaticamente

### 4. Adicionar Volume (Importante!)

1. Clique em **"+ New"** → **"Volume"**
2. Nome: `whatsapp-session`
3. Mount path: `/data`
4. Isso persiste a sessão do WhatsApp

### 5. Configurar Variáveis de Ambiente

No serviço principal (não no PostgreSQL), adicione:

```
NODE_ENV=production
PORT=8080
JWT_SECRET=SUA-CHAVE-SECRETA-AQUI-GERE-COM-openssl-rand-hex-32
WA_DATA_PATH=/data/wwebjs_auth
```

**Para gerar JWT_SECRET:**
```bash
openssl rand -hex 32
```

### 6. Inicializar Banco de Dados

Após primeiro deploy:

1. Vá em **"Deployments"** → Último deploy → **"Shell"**
2. Execute:
   ```bash
   cd crm-v2
   npm run db:push
   ```
3. Depois execute o seed:
   ```bash
   cd apps/backend
   npm run prisma:seed
   ```

### 7. Reiniciar Serviço

Reinicie o serviço após configurar o banco.

## ✅ Verificações

- [ ] Git inicializado
- [ ] Arquivos commitados
- [ ] Repositório no GitHub
- [ ] Railway conectado ao GitHub
- [ ] PostgreSQL adicionado
- [ ] Volume criado e montado
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados inicializado
- [ ] Seed executado

## 📝 Estrutura do Repositório

```
repositorio-pronto/
├── crm-v2/              ← PROJETO PRINCIPAL (foque aqui)
│   ├── apps/
│   │   ├── backend/     ← Backend NestJS
│   │   └── web/         ← Frontend React
│   ├── package.json
│   ├── nixpacks.toml
│   └── railway.json
├── .gitignore
└── README.md
```

## 🎉 Pronto!

Após seguir esses passos, seu CRM estará rodando na Railway!

Acesse a URL fornecida pelo Railway e teste:
- Login: `admin` / `admin123`
- Funcionários: `user1` / `user1`, etc.



