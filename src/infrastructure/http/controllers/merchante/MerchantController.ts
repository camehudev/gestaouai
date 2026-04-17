import { Request, Response } from 'express';
import { MerchantService } from '../../../../core/services/merchant/MerchantService';


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

async updateItemStatus(req: Request, res: Response) {
  try {
    const { empresaId, merchantId } = req.params;
    const statusData = req.body; // Ex: [{"id": "UUID", "status": "UNAVAILABLE"}]

    if (!empresaId || !merchantId) {
      return res.status(400).json({ error: 'Parâmetros insuficientes.' });
    }

    const result = await merchantService.updateItemStatus(empresaId, merchantId, statusData);
    return res.status(200).json(result);

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Erro ao atualizar status do item.'
    });
  }
}

async getUserCode(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    
    if (!empresaId) {
      return res.status(400).json({ error: 'empresaId é obrigatório.' });
    }

    const authInfo = await merchantService.generateUserCode(empresaId);
    
    // Retornamos os dados para o frontend mostrar ao lojista
    return res.status(200).json(authInfo);

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Erro ao gerar código de vínculo.'
    });
  }
}

async updateOptionPrice(req: Request, res: Response) {
  try {
    const { empresaId, merchantId } = req.params;
    const prices = req.body; // Espera um array: [{ id: "uuid", price: 5.50 }]

    if (!Array.isArray(prices)) {
      return res.status(400).json({ error: 'O corpo da requisição deve ser um array de preços.' });
    }

    const result = await merchantService.updateOptionPrice(empresaId, merchantId, prices);
    return res.status(200).json({
      message: 'Preço do(s) complemento(s) atualizado(s) com sucesso',
      //result
    });

  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Erro ao processar atualização de preços dos complementos.'
    });
  }
}


async updateOptionStatus(req: Request, res: Response) {
  try {
    const { empresaId, merchantId } = req.params;
    const body = req.body;

    // Validação: A API da UaiRango espera um Array. 
    // Se o frontend enviar um objeto único, nós envolvemos em um array [].
    let statusData = Array.isArray(body) ? body : [body];

    const result = await merchantService.updateOptionStatus(empresaId, merchantId, statusData);
    
    return res.status(200).json({
      message: 'Status do(s) complemento(s) atualizado(s) com sucesso',
      statusCode:200
      //result
    });

  } catch (error: any) {
    console.error(`[MerchantController] Erro ao atualizar status:`, error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Erro ao processar atualização de status.'
    });
  }
}

async updateStatusLoja(req: Request, res: Response) {
  try {
    const { empresaId, merchantId } = req.params;
    const body = req.body; // Aqui vem o JSON: { status: "AVAILABLE", operations: [...] } 
     
    // Chamada para o Service passando os dois identificadores
    const result = await merchantService.updateStatusLoja(empresaId, merchantId, body);

    // Retorno de sucesso para o Frontend/Postman
    return res.status(200).json({
      success: true,
      message: "Status atualizado com sucesso na UaiRango",
      data: result
    });

  } catch (error: any) {
    console.error(`[Controller Error] updateOptionStatus:`, error.message);
    
    // Retorna o status de erro vindo do Service ou 500 se for algo inesperado
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || "Erro interno ao processar atualização"
    });
  }
}


}