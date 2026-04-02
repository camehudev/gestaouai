import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // 1. Importe o cookie-parser
import { router } from './routes';
import dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis de ambiente logo no início

const app = express();

// --- CONFIGURAÇÃO DE MIDDLEWARES (A ORDEM É VITAL) ---

// 2. O CORS deve ser configurado antes das rotas e do parser de cookies
app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
    ],
    credentials: true, // Permite que o servidor aceite cookies do Front
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

app.use(express.json()); // Permite ler JSON no corpo da requisição
app.use(cookieParser()); // 3. ATIVE O COOKIE-PARSER AQUI (Obrigatório para ler req.cookies)

// 4. Só agora as rotas entram em ação
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor local em http://localhost:${PORT}`);
});

export default app;