import express from 'express';
import cors from 'cors';
import { router } from '../src/routes'; // Importando o arquivo de rotas que criaremos

const app = express();

app.use(cors());
app.use(express.json());

// Todas as rotas agora são gerenciadas pelo arquivo de rotas
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Gestão UAI rodando em http://localhost:${PORT}`);
});