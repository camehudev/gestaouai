import { Request, Response } from 'express';
import { AuthService } from '../../../core/services/AuthService';
import { STATUS_CODES } from 'http';

const authService = new AuthService();

export class AuthController {
  
  async authenticate(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
     
      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      } 

      const result = await authService.login(email, password);     
          
      res.cookie('token', result.token, {
        httpOnly: true, // Impede acesso via JavaScript
        secure: process.env.NODE_ENV === 'production', // Apenas HTTPS
        // maxAge: 6 * 60 * 60 * 1000, // 6 horas em milissegundos
        maxAge: 35 * 1000, // 30 segundos exatos
        sameSite: 'strict'
      });
      

      
      return res.json(result);

    } catch (error: any) {
      // Usamos 401 (Não autorizado) para falhas de login
      return res.status(401).json({ error: error.message, STATUS: STATUS_CODES[401] });
    }
  }
}