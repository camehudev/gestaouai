import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// 1. Instanciar o Prisma fora da função para ser global
const prisma = new PrismaClient();
const app = express();

app.use(express.json());

const PORT = 3333;

async function bootstrap() {
  try {
    // 2. Testar a conexão com o banco antes de subir o servidor
    await prisma.$connect();
    console.log('✅ Banco de Dados conectado com sucesso!');

    // Rota de teste simples
    app.get('/health', async (req: Request, res: Response) => {
      res.json({ status: 'ok', message: 'API Express online' });
    });

    // 3. Iniciar o servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Express rodando em http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Erro ao conectar no banco:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();