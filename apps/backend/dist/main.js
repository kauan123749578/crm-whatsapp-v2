"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cors_1 = __importDefault(require("cors"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: false
    });
    // CORS liberado (como estamos servindo o frontend no mesmo domínio, isso é mais “à prova de bala”)
    app.use((0, cors_1.default)({
        origin: '*',
        credentials: false,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
    }));
    const rawPort = (process.env.PORT || '').toString().trim();
    const port = Number.parseInt(rawPort || '8080', 10);
    await app.listen(port, '0.0.0.0');
    // eslint-disable-next-line no-console
    console.log(`🚀 CRM v2 backend em http://0.0.0.0:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map