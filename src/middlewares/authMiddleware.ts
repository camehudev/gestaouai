import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req?.headers.authorization;

  if (!authHeader) {
    return res?.status(401).json({ error: 'Token não fornecido.' });
  }

  // O formato do header é "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res?.status(401).json({ error: 'Erro no token.' });

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return res?.status(401).json({ error: 'Token mal formatado.' });

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) return res?.status(401).json({ error: 'Token inválido.' });

    // Injetamos as informações do usuário logado no objeto 'req'
    // Assim, o Controller pode acessar req.userId e req.empresaId
    //req?.userId = decoded.id;
    //req?.empresaId = decoded.empresaId;

    return next();
  });
};