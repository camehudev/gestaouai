import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // O Zod armazena os detalhes em result.error.issues
      return res.status(400).json({ 
        error: "Erro de validação",
        details: result.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message
        }))
      });
    }

    next(); 
  };
};