"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Essa lógica evita que a Vercel abra uma nova conexão com o banco
// toda vez que uma função for executada (previne o erro "too many clients")
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: ['query'], // Opcional: para ver os comandos SQL no terminal
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
