import { PrismaClient } from '@prisma/client';

// Essa lógica evita que a Vercel abra uma nova conexão com o banco
// toda vez que uma função for executada (previne o erro "too many clients")
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // Opcional: para ver os comandos SQL no terminal
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;