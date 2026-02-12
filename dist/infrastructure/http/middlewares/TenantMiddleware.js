"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = void 0;
const tenantMiddleware = (req, res, next) => {
    // Em produção, você extrairia isso de um Token JWT (ex: req.user.tenantId)
    // Para desenvolvimento inicial, usaremos um Header customizado
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
        return res.status(401).json({
            error: 'Não autorizado',
            message: 'ID da Empresa (Tenant) não identificado no cabeçalho.'
        });
    }
    req.tenantId = tenantId;
    next();
};
exports.tenantMiddleware = tenantMiddleware;
