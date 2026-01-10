import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false
  });

  // CORS liberado (como estamos servindo o frontend no mesmo domínio, isso é mais “à prova de bala”)
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
  console.log(`🚀 CRM v2 backend em http://0.0.0.0:${port}`);
}

bootstrap();


