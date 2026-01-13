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
exports.ChatOwnerGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatOwnerGuard = class ChatOwnerGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Usuário não autenticado');
        }
        // Admin pode editar qualquer chat
        if (user.role === 'admin') {
            return true;
        }
        // Employee só pode editar chats que são seus (userId = user.id)
        const chatId = request.params.chatId;
        if (chatId) {
            const chat = await this.prisma.chat.findUnique({
                where: { id: decodeURIComponent(chatId) },
                select: { userId: true }
            });
            if (!chat) {
                throw new common_1.ForbiddenException('Chat não encontrado');
            }
            // Se o chat não tem userId, qualquer funcionário pode editar (para atribuir a si)
            if (!chat.userId) {
                return true;
            }
            // Se o chat tem userId, só o dono ou admin pode editar
            if (chat.userId !== user.id) {
                throw new common_1.ForbiddenException('Você só pode editar tags de conversas atribuídas a você');
            }
        }
        return true;
    }
};
exports.ChatOwnerGuard = ChatOwnerGuard;
exports.ChatOwnerGuard = ChatOwnerGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatOwnerGuard);
//# sourceMappingURL=chat-owner.guard.js.map