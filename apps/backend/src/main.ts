import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import cors from 'cors';

// Normalizar variáveis de ambiente do banco
// Suporta DATABASE_URL ou URL_DO_BANCO_DE_DADOS (compatibilidade Railway)
if (!process.env.DATABASE_URL && process.env.URL_DO_BANCO_DE_DADOS) {
  process.env.DATABASE_URL = process.env.URL_DO_BANCO_DE_DADOS;
  console.log('📝 Usando URL_DO_BANCO_DE_DADOS como DATABASE_URL');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false
  });

  // Filtro global de exceções
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS liberado (como estamos servindo o frontend no mesmo domínio, isso é mais "à prova de bala")
  app.use(
    cors({
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
    })
  );

  const rawPort = (process.env.PORT || '').toString().trim();
  const port = Number.parseInt(rawPort || '8080', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚀 JOÃO FORNECEDOR operando em http://0.0.0.0:${port}`);
  // eslint-disable-next-line no-console
  console.log(`📊 DATABASE_URL: ${process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'}`);
}

bootstrap();


