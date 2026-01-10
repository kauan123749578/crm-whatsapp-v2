"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSenderGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatSenderGuard = class ChatSenderGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const body = request.body;
        if (!user) {
            throw new common_1.ForbiddenException('Usuário não autenticado');
        }
        // Admin pode enviar em qualquer chat
        if (user.role === 'admin') {
            return true;
        }
        // Employee: verificar se pode enviar na conversa
        const chatId = body?.chatId;
        if (!chatId) {
            return true; // Deixar passar se não tiver chatId (pode ser outro endpoint)
        }
        // Buscar chat no banco
        const hasDb = !!process.env.DATABASE_URL;
        if (!hasDb) {
            // Modo dev sem DB: permitir
            return true;
        }
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { userId: true }
        });
        if (!chat) {
            // Chat não existe no banco ainda, permitir criar e atribuir
            return true;
        }
        // Se o chat não tem userId, qualquer funcionário pode enviar (vai atribuir ao primeiro)
        if (!chat.userId) {
            return true;
        }
        // Se o chat tem userId diferente do usuário atual, BLOQUEAR
        if (chat.userId !== user.id) {
            throw new common_1.ForbiddenException('Esta conversa já está sendo atendida por outro funcionário. Apenas o atendente responsável ou o admin podem enviar mensagens.');
        }
        return true;
    }
};
exports.ChatSenderGuard = ChatSenderGuard;
exports.ChatSenderGuard = ChatSenderGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatSenderGuard);
//# sourceMappingURL=chat-sender.guard.js.map