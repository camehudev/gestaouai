import express from 'express';
import cors from 'cors';
import { router } from './routes'; // Ajustei o caminho se estiver na mesma pasta src

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

// Só inicia o servidor se não estiver na Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 rodando em http://localhost:${PORT}`);
  });
}

// OBRIGATÓRIO: Exportação para a Vercel
export default app;