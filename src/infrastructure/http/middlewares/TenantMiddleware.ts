import { Request, Response, NextFunction } from 'express';

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Em produção, você extrairia isso de um Token JWT (ex: req.user.tenantId)
  // Para desenvolvimento inicial, usaremos um Header customizado
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return res.status(401).json({ 
      error: 'Não autorizado', 
      message: 'ID da Empresa (Tenant) não identificado no cabeçalho.' 
    });
  }

  req.tenantId = tenantId;
  next();
};