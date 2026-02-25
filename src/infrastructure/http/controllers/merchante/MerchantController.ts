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


  // ... dentro da classe MerchantController

async getById(req: Request, res: Response) {
  try {  
   
     const { empresaId, merchantId } = req.params;     

    if (!empresaId || !merchantId) {
      return res.status(400).json({ error: 'empresaId e merchantId são obrigatórios.' });
    }

    const merchant = await merchantService.getMerchantById(empresaId, merchantId);
    return res.status(200).json(merchant);

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.message || 'Erro interno ao buscar detalhes da loja.'
    });
  }
}

async getStatus(req: Request, res: Response) {
  try {
    const { empresaId, merchantId } = req.params;

    if (!empresaId || !merchantId) {
      return res.status(400).json({ error: 'Parâmetros ausentes.' });
    }

    const status = await merchantService.getMerchantStatus(empresaId, merchantId);
    return res.status(200).json(status);

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.message || 'Erro ao buscar status da loja.'
    });
  }
}

async getDeliveryStatus(req: Request, res: Response) {
  try {
    const { empresaId, merchantId } = req.params;

    if (!empresaId || !merchantId) {
      return res.status(400).json({ error: 'empresaId e merchantId são obrigatórios.' });
    }

    const deliveryStatus = await merchantService.getDeliveryStatus(empresaId, merchantId);
    return res.status(200).json(deliveryStatus);

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.message || 'Erro ao buscar status de delivery.'
    });
  }
}

async updateStatus(req: Request, res: Response) {
  try {
    const { empresaId, merchantId } = req.params;
    const statusBody = req.body; // O que vem do frontend: { status: "AVAILABLE" } ou { status: "UNAVAILABLE" }

    if (!empresaId || !merchantId) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes.' });
    }

    const result = await merchantService.updateMerchantStatus(empresaId, merchantId, statusBody);
    return res.status(200).json(result);

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Erro ao atualizar status da loja.'
    });
  }
}


//LISTAR CATALOGOS

async getCatalogs(req: Request, res: Response) {
  try {
    const { empresaId, merchantId } = req.params;

    if (!empresaId || !merchantId) {
      return res.status(400).json({ error: 'empresaId e merchantId são obrigatórios.' });
    }

    const catalogs = await merchantService.listCatalogs(empresaId, merchantId);
    return res.status(200).json(catalogs);

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.message || 'Erro ao buscar catálogos.'
    });
  }
}

async getCatalogDetails(req: Request, res: Response) {
  try {
    const { empresaId, merchantId, catalogId } = req.params;

    if (!empresaId || !merchantId || !catalogId) {
      return res.status(400).json({ error: 'empresaId, merchantId e catalogId são obrigatórios.' });
    }

    const catalogData = await merchantService.getCatalogCategories(empresaId, merchantId, catalogId);
    return res.status(200).json(catalogData);

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.message || 'Erro ao carregar estrutura do cardápio.'
    });
  }
}

async createCategory(req: Request, res: Response) {
  try {
    const { empresaId, merchantId, catalogId } = req.params;
    const categoryData = req.body; // Dados da nova categoria

    if (!empresaId || !merchantId || !catalogId) {
      return res.status(400).json({ error: 'Parâmetros de rota obrigatórios ausentes.' });
    }

    const newCategory = await merchantService.createCategory(empresaId, merchantId, catalogId, categoryData);
    return res.status(201).json(newCategory); // Status 201 para recurso criado

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Erro ao criar categoria.'
    });
  }
}

async upsertItem(req: Request, res: Response) {
  try {
    const { empresaId, merchantId } = req.params;
    const fullItemData = req.body; // Aqui vai aquele JSON gigante com item, products, etc.

    if (!empresaId || !merchantId) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes.' });
    }

    const result = await merchantService.upsertFullItem(empresaId, merchantId, fullItemData);
    return res.status(200).json(result);

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Erro ao processar criação/atualização do item.'
    });
  }
}

async updatePrice(req: Request, res: Response) {
  try {
    const { empresaId, merchantId } = req.params;
    const priceData = req.body;
    
    if (!empresaId || !merchantId) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes.' });
    }

    const result = await merchantService.updateItemPrice(empresaId, merchantId, priceData);
    return res.status(200).json(result);
   

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Erro ao atualizar preço do item.'
    });
  }
}
}