import express from 'express';
import cors from 'cors';
import { router } from './routes';
import * as dotenv from 'dotenv';

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);
dotenv.config();

// O SEGREDO: Exportação compatível com Vercel
export default app;