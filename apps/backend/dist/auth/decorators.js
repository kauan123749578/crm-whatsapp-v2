"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.Public = void 0;
const common_1 = require("@nestjs/common");
const Public = () => (0, common_1.SetMetadata)('isPublic', true);
exports.Public = Public;
const Roles = (...roles) => (0, common_1.SetMetadata)('roles', roles);
exports.Roles = Roles;
//# sourceMappingURL=decorators.js.map