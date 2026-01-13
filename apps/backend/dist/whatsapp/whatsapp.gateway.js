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
exports.WhatsAppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const whatsapp_service_1 = require("./whatsapp.service");
let WhatsAppGateway = class WhatsAppGateway {
    wa;
    server;
    constructor(wa) {
        this.wa = wa;
    }
    emit = (event, payload) => {
        this.server.emit(event, payload);
    };
    async connectInstance(body, socket) {
        const instanceId = (body?.instanceId || 'wa1').trim();
        await this.wa.getOrCreate(instanceId, this.emit);
        socket.emit('wa:status', { instanceId, status: 'connecting', message: 'Inicializando...' });
        return { ok: true };
    }
};
exports.WhatsAppGateway = WhatsAppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], WhatsAppGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('wa:connect'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], WhatsAppGateway.prototype, "connectInstance", null);
exports.WhatsAppGateway = WhatsAppGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*', credentials: false },
        transports: ['polling', 'websocket']
    }),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService])
], WhatsAppGateway);
//# sourceMappingURL=whatsapp.gateway.js.map