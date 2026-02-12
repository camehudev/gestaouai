"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    // A chave que você definirá nas variáveis de ambiente da Vercel
    const validApiKey = process.env.API_KEY;
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({ error: 'Erro ao acessar. Contate o administrador' });
    }
    next();
};
exports.authMiddleware = authMiddleware;
