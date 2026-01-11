import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function initDb() {
  try {
    console.log('🔍 Verificando conexão com banco de dados...');
    
    // Verificar se há DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL não configurado. Pulando inicialização do banco.');
      return;
    }

    // Tentar conectar
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se já existe usuário admin
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (adminExists) {
      console.log('✅ Usuário admin já existe');
      return;
    }

    console.log('🌱 Criando usuário admin...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@crm.com',
        password: adminPassword,
        name: 'Administrador',
        role: 'admin'
      }
    });
    console.log('✅ Admin criado:', admin.username);
    console.log('📋 Credenciais: admin / admin123');

  } catch (error: any) {
    console.error('❌ Erro ao inicializar banco:', error.message);
    // Não lançar erro para não quebrar o start
  } finally {
    await prisma.$disconnect();
  }
}

initDb();

