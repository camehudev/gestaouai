import { Request, Response } from 'express';
import { MerchantService } from 'core/services/merchant/MerchantService';

const merchantService = new MerchantService();

export class MerchantController {
  
  /**
   * GET /merchants/:empresaId
   * Rota para listar todas as lojas vinculadas à conta UaiRango da empresa
   */
  async listAllMerchant(req: Request, res: Response) {
    try {
      const { empresaId } = req.params;
          
      if (!empresaId) {
        return res.status(400).json({ 
          error: 'O parâmetro empresaId é obrigatório.' 
        });
      }

      // Chama o service que criamos anteriormente
      const merchants = await merchantService.listMerchants(empresaId);
    
      // Retorno de sucesso
      return res.status(200).json(merchants);

    } catch (error: any) {
    
      // Tratamento de erros específicos
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({ error: error.message });
      }

      if (error.message.includes('autenticação')) {
        return res.status(401).json({ 
          error: 'Erro de autenticação com o UaiRango. Verifique as credenciais.' 
        });
      }

      // Erro genérico para o cliente
      return res.status(500).json({ 
        error: 'Ocorreu um erro interno ao processar a requisição.' 
      });
    }
  }
}