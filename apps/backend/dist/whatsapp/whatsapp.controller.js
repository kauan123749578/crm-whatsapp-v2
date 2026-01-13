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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const whatsapp_service_1 = require("./whatsapp.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const chat_owner_guard_1 = require("../auth/chat-owner.guard");
const chat_sender_guard_1 = require("../auth/chat-sender.guard");
const roles_guard_1 = require("../auth/roles.guard");
const decorators_1 = require("../auth/decorators");
let WhatsAppController = class WhatsAppController {
    wa;
    constructor(wa) {
        this.wa = wa;
    }
    list() {
        return this.wa.listInstances();
    }
    async chats(instanceId) {
        // Se ainda não existe, retorna 503 pra UI poder retry
        const inst = this.wa.getInstance(instanceId);
        if (!inst) {
            throw new common_1.HttpException({ error: 'Instância ainda não inicializada. Clique em Conectar e tente novamente.' }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        try {
            return await this.wa.getChats(instanceId);
        }
        catch (e) {
            const msg = String(e?.message || '');
            // Erros transitórios do whatsapp-web.js/puppeteer -> 503 (UI faz retry)
            if (/timed out|protocolTimeout|detached Frame|Target closed|Protocol error|Execution context|getChats|WWebJS|Store/i.test(msg)) {
                throw new common_1.HttpException({ error: msg }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
            }
            throw e;
        }
    }
    async messages(instanceId, chatId, limit) {
        const n = Number.parseInt(limit || '50', 10);
        // Se ainda não existe, retorna 503 (evita 500 no log e a UI pode retry depois)
        const inst = this.wa.getInstance(instanceId);
        if (!inst) {
            throw new common_1.HttpException({ error: 'Instância ainda não inicializada. Clique em Conectar e tente novamente.' }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        try {
            return await this.wa.getMessages(instanceId, decodeURIComponent(chatId), Number.isFinite(n) ? n : 50);
        }
        catch (e) {
            const msg = String(e?.message || '');
            if (/timed out|protocolTimeout|detached Frame|Target closed|Protocol error|Execution context/i.test(msg)) {
                throw new common_1.HttpException({ error: msg }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
            }
            throw e;
        }
    }
    async send(instanceId, body, req) {
        const userId = req.user?.id;
        return await this.wa.sendMessage(instanceId, body.chatId, body.text || '', body.mediaUrl, body.mediaType, userId);
    }
    async sendMedia(instanceId, chatId, text, file, req) {
        if (!file || !file.buffer) {
            throw new common_1.HttpException('Arquivo não enviado', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!chatId) {
            throw new common_1.HttpException('chatId é obrigatório', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            // Converter arquivo para base64
            const base64 = file.buffer.toString('base64');
            const mediaUrl = `data:${file.mimetype};base64,${base64}`;
            const userId = req.user?.id;
            return await this.wa.sendMessage(instanceId, chatId, text || '', mediaUrl, file.mimetype, userId);
        }
        catch (e) {
            throw new common_1.HttpException(`Erro ao enviar mídia: ${e.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateTags(instanceId, chatId, body, req) {
        const userId = req.user?.id;
        return await this.wa.updateChatTags(instanceId, decodeURIComponent(chatId), body.tags, userId);
    }
    async updateStage(instanceId, chatId, body, req) {
        const userId = req.user?.id;
        return await this.wa.updateChatStage(instanceId, decodeURIComponent(chatId), body.stage, userId);
    }
    async getContact(instanceId, chatId) {
        try {
            return await this.wa.getContactInfo(instanceId, decodeURIComponent(chatId));
        }
        catch (e) {
            throw new common_1.HttpException({ error: e.message || 'Erro ao buscar informações do contato' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getMetrics(req) {
        try {
            return await this.wa.getMetrics();
        }
        catch (e) {
            throw new common_1.HttpException({ error: e.message || 'Erro ao buscar métricas' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.WhatsAppController = WhatsAppController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('instances'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsAppController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('instances/:instanceId/chats'),
    __param(0, (0, common_1.Param)('instanceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "chats", null);
__decorate([
    (0, common_1.Get)('instances/:instanceId/chats/:chatId/messages'),
    __param(0, (0, common_1.Param)('instanceId')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "messages", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, chat_sender_guard_1.ChatSenderGuard),
    (0, common_1.Post)('instances/:instanceId/send'),
    __param(0, (0, common_1.Param)('instanceId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "send", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, chat_sender_guard_1.ChatSenderGuard),
    (0, common_1.Post)('instances/:instanceId/send-media'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
        fileFilter: (req, file, cb) => {
            // Aceitar imagens, vídeos, áudios e documentos
            const allowed = /\.(jpg|jpeg|png|gif|mp4|mov|avi|mp3|wav|pdf|doc|docx|xls|xlsx)$/i;
            if (allowed.test(file.originalname) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
                cb(null, true);
            }
            else {
                cb(new Error('Tipo de arquivo não permitido'), false);
            }
        }
    })),
    __param(0, (0, common_1.Param)('instanceId')),
    __param(1, (0, common_1.Body)('chatId')),
    __param(2, (0, common_1.Body)('text')),
    __param(3, (0, common_1.UploadedFile)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "sendMedia", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, chat_owner_guard_1.ChatOwnerGuard),
    (0, common_1.Patch)('instances/:instanceId/chats/:chatId/tags'),
    __param(0, (0, common_1.Param)('instanceId')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "updateTags", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, chat_owner_guard_1.ChatOwnerGuard),
    (0, common_1.Patch)('instances/:instanceId/chats/:chatId/stage'),
    __param(0, (0, common_1.Param)('instanceId')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "updateStage", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('instances/:instanceId/chats/:chatId/contact'),
    __param(0, (0, common_1.Param)('instanceId')),
    __param(1, (0, common_1.Param)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "getContact", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Get)('metrics'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "getMetrics", null);
exports.WhatsAppController = WhatsAppController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService])
], WhatsAppController);
//# sourceMappingURL=whatsapp.controller.js.map