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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    constructor(prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        const hasDb = !!process.env.DATABASE_URL;
        // Modo dev sem DB: retornar dados do payload diretamente
        if (!hasDb) {
            // Se for o usuário dev-admin, retornar dados mockados
            if (payload.userId === 'dev-admin') {
                return {
                    id: 'dev-admin',
                    email: 'admin@crm.com',
                    name: 'Admin Dev',
                    role: 'admin'
                };
            }
            // Caso contrário, retornar dados do payload
            return {
                id: payload.userId,
                email: payload.email,
                name: payload.email.split('@')[0], // Fallback name
                role: payload.role
            };
        }
        // Com DB: buscar usuário no banco
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: payload.userId },
                select: { id: true, email: true, role: true, name: true }
            });
            if (!user) {
                throw new common_1.UnauthorizedException('Usuário não encontrado');
            }
            return user;
        }
        catch (error) {
            // Se houver erro no banco, usar dados do payload como fallback
            return {
                id: payload.userId,
                email: payload.email,
                name: payload.email.split('@')[0],
                role: payload.role
            };
        }
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map