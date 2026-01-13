#!/bin/bash
set -e

echo "🧹 Limpando arquivos antigos..."
npm run clean || true

echo "📦 Construindo frontend..."
npm run build -w @crm/web

echo "📋 Copiando frontend para public..."
node tools/copy-web-dist.mjs

echo "🔧 Gerando Prisma..."
npm run prisma:generate -w @crm/backend

echo "🏗️ Construindo backend..."
npm run build -w @crm/backend

echo "✅ Build completo!"
echo "🚀 Versão: João Fornecedor - $(date +%Y%m%d-%H%M%S)"
