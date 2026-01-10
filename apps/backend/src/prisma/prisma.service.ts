import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly enabled = !!process.env.DATABASE_URL;

  async onModuleInit() {
    if (!this.enabled) {
      // eslint-disable-next-line no-console
      console.warn('[Prisma] DATABASE_URL não definido. Rodando sem banco (modo dev).');
      return;
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    if (!this.enabled) return;
    await this.$disconnect();
  }
}


