import express from 'express';
import cors from 'cors';
import { router } from './routes';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; // 1. Importe aqui

const app = express();

app.use(express.json());
app.use(cookieParser()); // IMPORTANTE: Se você usa cookies, instale e use o cookie-parser
app.use(router);
dotenv.config();

app.use(cors({
    origin: [
    'http://localhost:5173',         // Alternativa local    
    'http://127.0.0.1:5173',         // Alternativa local
    'http://localhost:5174',          // Desenvolvimento local
      //'xxx',  // Seu site em produção  
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
    }));


// O SEGREDO: Exportação compatível com Vercel
export default app;