import express from 'express';
import cors from 'cors';
import { router } from './routes'; // Ajustei o caminho se estiver na mesma pasta src

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor local em http://localhost:${PORT}`);
});

// OBRIGATÓRIO: Exportação para a Vercel
export default app;