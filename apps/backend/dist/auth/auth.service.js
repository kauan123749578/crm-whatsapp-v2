"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(dto) {
        const hasDb = !!process.env.DATABASE_URL;
        if (!hasDb) {
            // Modo dev sem DB: permitir login padrão
            const devUsers = {
                'admin': { password: 'admin123', name: 'Administrador', role: 'admin', id: 'dev-admin' },
                'user1': { password: 'user1', name: 'Funcionário 1', role: 'employee', id: 'dev-user1' },
                'user2': { password: 'user2', name: 'Funcionário 2', role: 'employee', id: 'dev-user2' },
                'user3': { password: 'user3', name: 'Funcionário 3', role: 'employee', id: 'dev-user3' }
            };
            const user = devUsers[dto.username];
            if (user && user.password === dto.password) {
                return {
                    access_token: this.jwtService.sign({
                        userId: user.id,
                        email: `${dto.username}@crm.com`,
                        role: user.role
                    }),
                    user: {
                        id: user.id,
                        username: dto.username,
                        email: `${dto.username}@crm.com`,
                        name: user.name,
                        role: user.role
                    }
                };
            }
            throw new common_1.UnauthorizedException('Usuário ou senha incorretos');
        }
        const user = await this.prisma.user.findUnique({
            where: { username: dto.username }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário ou senha incorretos');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Usuário ou senha incorretos');
        }
        const payload = {
            userId: user.id,
            email: user.email || `${user.username}@crm.com`,
            role: user.role
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email || `${user.username}@crm.com`,
                name: user.name,
                role: user.role
            }
        };
    }
    async register(dto) {
        const hasDb = !!process.env.DATABASE_URL;
        if (!hasDb) {
            throw new Error('Database não habilitado. Não é possível criar usuários.');
        }
        const existing = await this.prisma.user.findUnique({
            where: { username: dto.username }
        });
        if (existing) {
            throw new common_1.UnauthorizedException('Usuário já cadastrado');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email || null,
                password: hashedPassword,
                name: dto.name,
                role: dto.role || 'employee'
            },
            select: { id: true, username: true, email: true, name: true, role: true }
        });
        const payload = {
            userId: user.id,
            email: user.email || `${user.username}@crm.com`,
            role: user.role
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email || `${user.username}@crm.com`,
                name: user.name,
                role: user.role
            }
        };
    }
    async getMe(userId) {
        const hasDb = !!process.env.DATABASE_URL;
        if (!hasDb) {
            // Modo dev: retornar dados mockados baseado no ID
            const devUsers = {
                'dev-admin': { id: 'dev-admin', username: 'admin', email: 'admin@crm.com', name: 'Administrador', role: 'admin' },
                'dev-user1': { id: 'dev-user1', username: 'user1', email: 'user1@crm.com', name: 'Funcionário 1', role: 'employee' },
                'dev-user2': { id: 'dev-user2', username: 'user2', email: 'user2@crm.com', name: 'Funcionário 2', role: 'employee' },
                'dev-user3': { id: 'dev-user3', username: 'user3', email: 'user3@crm.com', name: 'Funcionário 3', role: 'employee' }
            };
            return devUsers[userId] || devUsers['dev-admin'];
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, email: true, name: true, role: true }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não encontrado');
        }
        return {
            id: user.id,
            username: user.username,
            email: user.email || `${user.username}@crm.com`,
            name: user.name,
            role: user.role
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map