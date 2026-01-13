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

    // Verificar se a tabela users existe (testando com uma query simples)
    try {
      await prisma.$queryRaw`SELECT 1 FROM "users" LIMIT 1`;
    } catch (tableError: any) {
      if (tableError.message?.includes('não existe') || tableError.message?.includes('does not exist')) {
        console.error('❌ Tabelas não criadas! Execute: npm run db:push');
        console.error('   Ou no Railway Shell: npm run db:push -w @crm/backend');
        return;
      }
      throw tableError;
    }

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
    if (error.message?.includes('não existe') || error.message?.includes('does not exist')) {
      console.error('💡 Execute primeiro: npm run db:push');
    }
    // Não lançar erro para não quebrar o start
  } finally {
    await prisma.$disconnect();
  }
}

initDb();

