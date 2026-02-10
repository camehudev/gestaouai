import express from 'express';
import cors from 'cors';
import { router } from '../src/routes'; 

const app = express();

app.use(cors());
app.use(express.json());

// Todas as rotas agora são gerenciadas pelo arquivo de rotas
app.use(router);

// IMPORTANTE PARA VERCEL: 
// O app.listen não deve rodar no ambiente de produção da Vercel,
// pois ela gerencia as requisições de forma diferente.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Gestão UAI rodando em http://localhost:${PORT}`);
  });
}

// O segredo para o erro 500 sumir:
export default app;