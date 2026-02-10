import express from 'express';
// Importaremos as rotas aqui futuramente

const app = express();

// Middlewares Globais
app.use(express.json());

// Exemplo de rota de Health Check (sem proteção de tenant)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Gestão UAI Server is running' });
});

// A partir daqui, as rotas de negócio usariam o middleware de tenant
// app.use('/api/v1', tenantMiddleware, businessRoutes);

export { app };