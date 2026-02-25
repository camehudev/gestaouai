import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { ConfigUaiRango } from 'core/entities/Empresas';


const prisma = new PrismaClient();

interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  type: string;
}

export class MerchantService {
  // private readonly AUTH_URL = process.env.AUTH_URL ;
  private readonly AUTH_URL = `${process.env.AUTH_URL}`;
  private readonly URL_MERCHANTS = `${process.env.URL_MERCHANTS}`;  
  private readonly API_KEY= `${process.env.API_KEY}`; 
  
  /**
   * Método principal para listar os merchants
   */
  async listMerchants(empresaId: string) {

  const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });


    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Empresa ou configuração não encontrada.`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    
    // 1. Obtém o token (Válido ou Novo)
    const token = await this.getValidToken(empresaId, config);   

    // 2. Chama a rota de merchants
    const { data } = await axios.get(this.URL_MERCHANTS , {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'x-env': 'development',
        'x-api-key': this.API_KEY,
        'tenant-id': empresaId
      }
    });

    return data;
  }

  async getValidToken(empresaId: string, config: ConfigUaiRango): Promise<string> {
    const agora = new Date();

   
   
    // 1. Verifica validade (Margem de segurança de 1 min)
    if (config?.access_token && config?.expires_at) {
      const dataExpiracao = new Date(config.expires_at);       
      if (!isNaN(dataExpiracao.getTime()) && agora < new Date(dataExpiracao.getTime() - 60000)) {
        return config.access_token;
      }
    }

    // 2. Se expirou ou não existe, gera e salva
    const authData = await this.autenticar(config); 

    await this.salvarTokenNoBanco(empresaId, authData, config);
    return authData.accessToken;
  }

  private async autenticar(config: ConfigUaiRango): Promise<AuthResponse> {
    const clientId = config.client_id?.trim();
    const secretKey = config.secret_key?.trim();

    if (!clientId || !secretKey) {
      throw new Error('Configuração client_id ou secret_key ausente no banco.');
    }

    const params = new URLSearchParams();
    params.append('grantType', 'client_credentials');
    params.append('clientId', clientId);
    params.append('clientSecret', secretKey);

    try {
      const { data } = await axios.post(this.AUTH_URL, params.toString(), {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          // IMPORTANTE: Mude para 'production' se não for ambiente de teste
          'x-env': 'development',
          'x-api-key': this.API_KEY,
        }
      });    

      return data as AuthResponse;
    } catch (error: any) {   
      throw new Error(`Falha na autenticação: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    }
  }

  private async salvarTokenNoBanco(empresaId: string, authData: AuthResponse, configAtual: ConfigUaiRango) {
    // Calcula expiração: UaiRango costuma retornar em segundos (ex: 3600)
    const dataExpiracao = new Date();
    dataExpiracao.setSeconds(dataExpiracao.getSeconds() + (Number(authData.expiresIn) || 3600));

    // Monta o novo objeto mantendo o que já existia (IDs, Keys) e atualizando o token
    const novaConfig = {
      ...configAtual,
      access_token: authData.accessToken,
      expires_at: dataExpiracao.toISOString()
    };

    await prisma.empresa.update({
      where: { id: empresaId },
      data: { 
        configUaiRango: novaConfig // Se for campo JSON no Prisma, ele aceita o objeto direto
      }
    });
  }


async getMerchantById(empresaId: string, merchantId: string) {
  try {
    // 1. Recupera a configuração para obter o token válido
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Configuração não encontrada para a empresa: ${empresaId}`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    const token = await this.getValidToken(empresaId, config);

    // 2. Chamada para o endpoint de detalhes
    // Note que usamos a URL específica que você passou
    const url = `https://merchant-api.uairango.com/merchant/v1.0/merchants/${merchantId}`;
    
    const { data } = await axios.get(url, {headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-env': 'development',
        'x-api-key': this.API_KEY,
      }
    });

    return data;

  } catch (error: any) {
    console.error(`[MerchantService] Erro ao buscar loja ${merchantId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtém o status atual e operações disponíveis de uma loja
 * @param empresaId ID da empresa (para o token)
 * @param merchantId ID da loja na UaiRango
 */
async getMerchantStatus(empresaId: string, merchantId: string) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Configuração não encontrada.`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    const token = await this.getValidToken(empresaId, config);

    // Endpoint de Status
    const url = `https://merchant-api.uairango.com/merchant/v1.0/merchants/${merchantId}/status`;
    
    const { data } = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',
        'x-api-key': this.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
    console.error(`[MerchantService] Erro ao buscar status ${merchantId}:`, error.response?.data || error.message);
    throw error;
  }
}


async getDeliveryStatus(empresaId: string, merchantId: string) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Configuração não encontrada para a empresa: ${empresaId}`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    const token = await this.getValidToken(empresaId, config);

    // Endpoint específico para Delivery
    const url = `https://merchant-api.uairango.com/merchant/v1.0/merchants/${merchantId}/status/delivery`;
    
    const { data } = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',
        'x-api-key': this.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
    console.error(`[MerchantService] Erro ao buscar status de delivery ${merchantId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Modifica o status de um estabelecimento ou de suas operações
 * Endpoint: PATCH /merchants/{merchantId}
 * @param statusBody Objeto contendo o novo status (ex: { status: 'AVAILABLE' })
 */
async updateMerchantStatus(empresaId: string, merchantId: string, statusBody: any) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Configuração não encontrada.`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    const token = await this.getValidToken(empresaId, config);

    const url = `https://merchant-api.uairango.com/merchant/v1.0/merchants/${merchantId}`;
    
    // Usamos PATCH para modificações parciais de status
    const { data } = await axios.patch(url, statusBody, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',
        'x-api-key': this.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
    console.error(`[MerchantService] Erro ao atualizar status do merchant ${merchantId}:`, error.response?.data || error.message);
    throw error;
  }
}


/**
 * Lista todos os catálogos disponíveis de um merchant
 * Endpoint: GET /catalog/v2.0/merchants/{merchantId}/catalogs
 */
async listCatalogs(empresaId: string, merchantId: string) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Configuração não encontrada.`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    const token = await this.getValidToken(empresaId, config);

    // URL da API de Catálogo v2.0
    const url = `https://merchant-api.uairango.com/catalog/v2.0/merchants/${merchantId}/catalogs`;
    
    const { data } = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',
        'x-api-key': this.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
    console.error(`[MerchantService] Erro ao listar catálogos ${merchantId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtém todas as categorias e itens de um catálogo específico
 * Endpoint: GET /catalog/v2.0/merchants/{merchantId}/catalogs/{catalogId}/categories
 */
async getCatalogCategories(empresaId: string, merchantId: string, catalogId: string) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Configuração não encontrada.`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    const token = await this.getValidToken(empresaId, config);

    // Montamos a URL com o query param includeItems
    const url = `https://merchant-api.uairango.com/catalog/v2.0/merchants/${merchantId}/catalogs/${catalogId}/categories`;
    
    const { data } = await axios.get(url, {
      params: { includeItems: 'true' }, // Passando como objeto de params do Axios
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',
        'x-api-key': this.API_KEY
      }
    });

    return data;
  } catch (error: any) {
    console.error(`[MerchantService] Erro ao buscar categorias do catálogo ${catalogId}:`, error.response?.data || error.message);
    throw error;
  }
}


/**
 * Cria uma nova categoria dentro de um catálogo específico
 * Endpoint: POST /catalog/v2.0/merchants/{merchantId}/catalogs/{catalogId}/categories
 */
async createCategory(empresaId: string, merchantId: string, catalogId: string, categoryData: any) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Configuração não encontrada.`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    const token = await this.getValidToken(empresaId, config);

    const url = `https://merchant-api.uairango.com/catalog/v2.0/merchants/${merchantId}/catalogs/${catalogId}/categories`;
    
    const { data } = await axios.post(url, categoryData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',
        'x-api-key': this.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
    console.error(`[MerchantService] Erro ao criar categoria no catálogo ${catalogId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Cria um novo item (produto) global no estabelecimento
 * Endpoint: POST /catalog/v2.0/merchants/{merchantId}/items
 */
async createItem(empresaId: string, merchantId: string, itemData: any) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Configuração não encontrada.`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    const token = await this.getValidToken(empresaId, config);

    const url = `https://merchant-api.uairango.com/catalog/v2.0/merchants/${merchantId}/items`;
    
    const { data } = await axios.post(url, itemData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',
        'x-api-key': this.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
    console.error(`[MerchantService] Erro ao criar item no merchant ${merchantId}:`, error.response?.data || error.message);
    throw error;
  }
}
/**
 * Atualiza o preço de um ou mais itens
 * Endpoint: PATCH /catalog/v2.0/merchants/{merchantId}/items/price
 */
async updateItemPrice(empresaId: string, merchantId: string, priceData: any) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Configuração não encontrada.`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    const token = await this.getValidToken(empresaId, config);

    const url = `https://merchant-api.uairango.com/catalog/v2.0/merchants/${merchantId}/items/price`;
    
    // Geralmente é um PATCH para atualizações parciais
    const { data } = await axios.patch(url, priceData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',
        'x-api-key': this.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
    console.error(`[MerchantService] Erro ao editar preço no merchant ${merchantId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Cria ou atualiza um item completo e suas entidades (Products, Groups, Options)
 * Endpoint: POST /catalog/v2.0/merchants/{merchantId}/items
 */
async upsertFullItem(empresaId: string, merchantId: string, fullItemData: any) {
  try {


    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Configuração não encontrada.`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango;
    const token = await this.getValidToken(empresaId, config);

    const url = `https://merchant-api.uairango.com/catalog/v2.0/merchants/${merchantId}/items`;
    
    const { data } = await axios.post(url, fullItemData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',        
        'x-api-key': this.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
    console.error(`[MerchantService] Erro no Upsert de Item ${merchantId}:`, error.response?.data || error.message);
    throw error;
  }
}


}