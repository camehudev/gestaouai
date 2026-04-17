import { Request, Response } from 'express';
import { UserService } from '../../../core/services/UserService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * POST /:empresaId/users
   * Cria um novo usuário vinculado a uma empresa
   */
  async store(req: Request, res: Response) {

    console.log(req.body)
    try {
      const { empresaId } = req.params;
      const { name, email, password, role, status  } = req.body;

      // Validação básica
      if (!name || !email || !password || !role || !status || !empresaId ) {
        return res.status(400).json({ error: 'nome, e-mail, senha, active , role e empresa são obrigatórios.' });
      }

      const user = await this.userService.create({
        name,
        email,
        password,       
        empresaId,
        role,
        status
      });

      return res.status(201).json(user);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /:empresaId/users
   * Lista todos os usuários de uma empresa específica (Tenant Isolation)
   */
  async index(req: Request, res: Response) {
    try {
      const { empresaId } = req.params;
      const users = await this.userService.listByEmpresa(empresaId);
      
      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
  }

  /**
   * GET /:empresaId/users/:id
   * Busca um usuário específico, garantindo que ele pertença àquela empresa
   */
  async show(req: Request, res: Response) {
    try {
      const { empresaId, id } = req.params;
      
      // Aqui você usaria um método no service para buscar por ID e Empresa
      const user = await this.userService.findByIdAndEmpresa(id, empresaId);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado nesta empresa.' });
      }

      return res.json(user);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
  }

  /**
   * DELETE /:empresaId/users/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { empresaId, id } = req.params;
      
      await this.userService.delete(id, empresaId);
      
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}