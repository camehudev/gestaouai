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
  // O operador 'as string' ajuda o TypeScript a entender que o valor virá
  
  /**
   * Método principal para listar os merchants
   */
  async listMerchants(empresaId: string) {

  const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId  },
      select: { configUaiRango: true, uaiMerchantId: true }
    });


    if (!empresa || !empresa.configUaiRango) {
      throw new Error(`Empresa ou configuração não encontrada.`);
    }

    const config = empresa.configUaiRango as any as ConfigUaiRango; 
    
    // 1. Obtém o token (Válido ou Novo)
    const token = await this.getValidToken(empresaId, config);   

    // 2. Chama a rota de merchants
    const { data } = await axios.get(`https://merchant-api.uairango.com/merchant/v1.0/merchants` , {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'x-env': 'development',
        'x-api-key': process.env.API_KEY,
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

 /**
 * Solicita o Token de Acesso (Access Token)
 * Rota: POST /authentication/v1.0/oauth/token
 */

private async autenticar(config: ConfigUaiRango): Promise<AuthResponse> {
  const clientId = config.client_id?.trim();
  const clientSecret = config.secret_key?.trim(); // Use o nome da coluna do seu banco

  if (!clientId || !clientSecret) {
    throw new Error('clientId ou clientSecret ausentes para autenticação.');
  }

  // A URL base deve ser https://merchant-api.uairango.com
  const url = `https://merchant-api.uairango.com/authentication/v1.0/oauth/token`;

  // Preparando o corpo como x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('grantType', 'client_credentials');
  params.append('clientId', clientId);
  params.append('clientSecret', clientSecret);

  try {
    const { data } = await axios.post(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'x-api-key': process.env.API_KEY, // Sua chave de desenvolvedor do .env
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development'
      }
    });
   
    return data as AuthResponse;

  } catch (error: any) {
    console.error(`Erro no Request Token (${url}):`, error.response?.data || error.message);
    throw new Error(`Falha na geração do token: ${error.response?.status}`);
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
        'x-api-key': process.env.API_KEY,
      }
    });

    return data;

  } catch (error: any) {   
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
        'x-api-key': process.env.API_KEY,
      }
    });

    return data;
  } catch (error: any) {    
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
        'x-api-key': process.env.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
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
        'x-api-key': process.env.API_KEY,
      }
    });

    return data;
  } catch (error: any) {    
    throw error;
  }
}


/**
 * Lista todos os catálogos disponíveis de um merchant
 * Endpoint: GET /catalog/v2.0/merchants/{merchantId}/catalogs
 */
async listCatalogs(empresaId: string, merchantId: string) {

  console.log(empresaId)
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
        'x-api-key': process.env.API_KEY,
      }
    });

    return data;
  } catch (error: any) { 
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
        'x-api-key': process.env.API_KEY
      }
    });

    return data;
  } catch (error: any) {  
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
        'x-api-key': process.env.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
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
        'x-api-key': process.env.API_KEY,
      }
    });

    return data;
  } catch (error: any) {

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
        'x-api-key': process.env.API_KEY,
      }
    });

    return data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Altera o status de um ou mais itens (Disponível/Indisponível)
 * Endpoint: PATCH /catalog/v2.0/merchants/{merchantId}/items/status
 */
async updateItemStatus(empresaId: string, merchantId: string, statusData: any) {
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

    // Seguindo o padrão v2.0 de catálogo
    const url = `https://merchant-api.uairango.com/catalog/v2.0/merchants/${merchantId}/items/status`;
    
    const { data } = await axios.patch(url, statusData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',        
        'x-api-key': process.env.API_KEY,
      }
    });

    return data;
  } catch (error: any) {    
    throw error;
  }
}

/**
 * Gera um código de usuário (userCode) para autorização do lojista
 * Rota: POST /authentication/v1.0/oauth/userCode
 */
async generateUserCode(empresaId: string) {
  try {
    // 1. Busca as configurações da empresa no banco
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error('Configurações da UaiRango não encontradas para esta empresa.');
    }

    const config = empresa.configUaiRango as any;
    const clientId = config.client_id?.trim();

    if (!clientId) {
      throw new Error('Client ID não configurado.');
    }

    // 2. Chama a API da UaiRango
    const url = `https://merchant-api.uairango.com/authentication/v1.0/oauth/userCode`;
    
    const { data } = await axios.post(url, 
      { clientId: clientId }, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': process.env.API_KEY, // Sua chave de desenvolvedor do .env
          'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development'
        }
      }
    );

    // O retorno esperado contém: userCode, deviceCode, verificationUrl, expiresIn e interval
    return data;

  } catch (error: any) {   
    throw error;
  }
}

async updateOptionPrice(empresaId: string, merchantId: string, priceData: any) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    const config = empresa?.configUaiRango as any;
    const token = await this.getValidToken(empresaId, config);

    // Garanta que a URL base esteja correta (sem duplicidade como vimos antes)    
    const url = `https://merchant-api.uairango.com/catalog/v2.0/merchants/${merchantId}/options/price`;
    
    /**
     * 🛠️ NORMALIZAÇÃO DO PAYLOAD
     * A UaiRango v2 exige optionId e o objeto price.
     * Se priceData vier como array, pegamos o primeiro.
     */
    const item = Array.isArray(priceData) ? priceData[0] : priceData;

    const payload = {
      optionId: item.optionId || item.id,
      price: {
        value: item.price?.value ?? item.value // Aceita price.value ou value direto
      },
      // Opcional: Adiciona o preço por catálogo se existir, senão usa o padrão
      priceByCatalog: item.priceByCatalog || [
        {
          value: item.price?.value ?? item.value,
          catalogContext: "DEFAULT"
        }
      ]
    };   

    const { data } = await axios.patch(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development',
        'x-api-key': process.env.API_KEY
      }
    });

    return data;
  } catch (error: any) {   
    throw error;
  }
}

async updateOptionStatus(empresaId: string, merchantId: string, statusData: any[]) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    const config = empresa?.configUaiRango as any;
    const token = await this.getValidToken(empresaId, config);

    const url = `https://merchant-api.uairango.com/catalog/v2.0/merchants/${merchantId}/options/status`;
    
    /**
     * 🛠️ CORREÇÃO DO PAYLOAD
     * Pegamos o primeiro item do array e garantimos que ele seja um objeto único
     * com os campos 'optionId' e 'status' exatamente como a API exigiu.
     */
    const item = Array.isArray(statusData) ? statusData[0] : statusData;
    
    const payload = {
      optionId: item.optionId || item.id,
      status: item.status // Deve ser 'AVAILABLE' ou 'UNAVAILABLE'
    };
 

    // IMPORTANTE: Enviamos o 'payload' e não o 'statusData'
    const { data } = await axios.patch(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY,
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development'
      }
    });   

    return data;
  } catch (error: any) {    
    throw error;
  }
}


async updateStatusLoja(empresaId: string, merchantId: string, statusData: any): Promise<any> {
  try {
    // 1. Busca as configurações da empresa no seu banco
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { configUaiRango: true }
    });

    if (!empresa || !empresa.configUaiRango) {
      throw new Error('Configurações do UaiRango não encontradas para esta empresa.');
    }

    // 2. Extrai o token ou dados necessários da config salva (ajuste conforme seu schema)
    const config = empresa?.configUaiRango as any;
    const token = await this.getValidToken(empresaId, config);

    // 3. Monta a chamada para a API oficial do UaiRango
  
    const url = `https://merchant-api.uairango.com/merchant/v1.0/merchants/${merchantId}`;   

    const response = await axios.put(url, statusData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',      
        'x-api-key': process.env.API_KEY,
        'x-env': process.env.NODE_ENV === 'production' ? 'production' : 'development'
      }
    });

    return response.data;

  } catch (error: any) {
    console.error(`[Error updateOptionStatus] Empresa: ${empresaId}`, error.message);
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message
    };
  }
}


}