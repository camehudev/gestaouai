import axios from 'axios';
import { PedidoStatus, PrismaClient } from '@prisma/client';
import { ConfigUaiRango } from '../entities/Empresas';
import { id } from 'zod/v4/locales/index.cjs';
import { STATUS_CODES } from 'http';

const prisma = new PrismaClient();

interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  type: string;
}

interface IPedido{
    id: string,
    uairango_id: string ,
    code: string,
    fullCode: string,
    orderId: string,
    merchantId: string,
    createdAt: string,
    tenant_id: string

}

export class UaiRangoService {

  async getValidToken(empresaId: string, config: ConfigUaiRango): Promise<string> {
    const agora = new Date();
    
    // 1. Verifica se o token atual ainda é válido (com margem de 1 min)
    if (config?.access_token && config?.expires_at) {
      const dataExpiracao = new Date(config.expires_at);
      if (!isNaN(dataExpiracao.getTime()) && agora < new Date(dataExpiracao.getTime() - 60000)) {
        return config.access_token;
      }
    }

    // 2. Se não for válido, gera um novo
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
    console.error(`❌ Erro no Request Token (${url}):`, error.response?.data || error.message);
    throw new Error(`Falha na geração do token: ${error.response?.status}`);
  }
}

  private async salvarTokenNoBanco(empresaId: string, authData: AuthResponse, configAtual: ConfigUaiRango) {
    const dataExpiracao = new Date();
    dataExpiracao.setSeconds(dataExpiracao.getSeconds() + (Number(authData.expiresIn) || 3600));

    const novaConfig = {
      ...configAtual,
      access_token: authData.accessToken,
      expires_at: dataExpiracao.toISOString()
    };

    await prisma.empresa.update({
      where: { id: empresaId },
      data: { configUaiRango: novaConfig as any }
    });
  }

  async buscarEventosPendentes(empresaId: string, config: any) {
    const token = await this.getValidToken(empresaId, config);
    const url = `https://merchant-api.uairango.com/events/v1.0/events:polling?types=PLC,CFM,RTP,DSP,CAN&groups=ORDER_STATUS`;   

    const { data } = await axios.get(url, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,        
        'x-env': 'development',
        'x-api-key': `${process.env.API_KEY}`, 
        'tenant-id': empresaId
      }
    });

   return data || [];
  }

  //Este metodo confirma que um evento foi recebido e processado, evitando que ele seja enviado novamente no polling

  async confirmarRecebimento(empresaId: string, config: ConfigUaiRango, eventIds: string[]) {
    const token = await this.getValidToken(empresaId, config);
    const url= `https://merchant-api.uairango.com/events/v1.0/events/acknowledgment`;  
    
    const body = eventIds.map(eventId => ({ id: eventId }));
    await axios.post(url, body, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-env': 'development',
        'x-api-key': `${process.env.API_KEY}`,
        
      }
    });

    return true;
  }

 // 1. Adicionamos o tenantId (empresaId) como parâmetro obrigatório
async salvarPedidoNoBanco(tenantId: string, pedido: IPedido ) { 

  try {
    if(!tenantId || !pedido ){
      throw new Error('Falha ao salvar pedido')
    }

    const pedidosSalvos = await this.createPedidoBanco(pedido, tenantId);
    
    if(pedidosSalvos){ 

      const result = await this.saveHistorico(pedido, tenantId);

      if (result){ return {status:200, message: 'Pedido salvo com sucesso!'}   }

     }

   

  }  
  
  catch (error: any) { 
    console.error("Erro crítico em salvarPedidoNoBanco:", error);
    // Relançamos o erro com contexto para quem chamou o método
    throw new Error(`Falha ao processar pedido ${pedido?.orderId}: ${error.message}`);
  }
}

async createPedidoBanco(pedido: IPedido, tenantId: string) {
  // 1. Definição do De-Para de Status
  const statusMap: Record<string, PedidoStatus> = {
    'PLC': PedidoStatus.PLACED,
    'CFM': PedidoStatus.CONFIRMED,
    'DSP': PedidoStatus.DISPATCHED,
    'CAN': PedidoStatus.CANCELLED,
    'RTP': PedidoStatus.READY_TO_PICKUP
  };

  // 2. Extração Segura com fallback (importante para não quebrar o banco)
  const statusMapeado = statusMap[pedido.code] || PedidoStatus.PLACED;

  // 3. Operação Principal
  const restPedidoSalvo = await prisma.pedido.upsert({
    where: { uairango_id: String(pedido.id) }, // Garante busca pelo ID único
    update: {
      code: pedido.code,
      fullCode: statusMapeado, // Atualiza para o status correto
      updatedAt: new Date()
    },
    create: {     
      uairango_id: String(pedido.id),
      code: pedido.code,
      fullCode: statusMapeado, // Salva o status mapeado
      orderId: String(pedido.orderId),
      merchantId: String(pedido.merchantId),
      tenant_id: tenantId,
      createdAt: pedido.createdAt ? new Date(pedido.createdAt) : new Date()
    }
  });

  return restPedidoSalvo;
}


 

 async saveHistorico(pedidoSalvo: any, tenantId: string) {   
    try {
      // 4. Registro de Histórico (Auditoria) - Apenas CRIAR (Insert)

    await prisma.pedidoHistorico.create({
      data: {       
        pedido_id: pedidoSalvo.id,
        code: pedidoSalvo.code,       
        fullCode: pedidoSalvo.fullCode, 
        orderId: pedidoSalvo.orderId, 
        merchantId: pedidoSalvo.merchantId,       
        tenant_id: tenantId,
        createdAt: new Date() // Registro imutável do momento da mudança
      }
    });

      return { status: 200, message: 'Histórico registrado com sucesso!' };

    } catch (error: any) {
      console.error("Erro ao salvar histórico:", error);
      throw new Error(`Erro no log de histórico: ${error.message}`);
    }
}
   
 

  async buscarPedidoPorId(empresaId: string, config: any, orderId: string) {
    const token = await this.getValidToken(empresaId, config);

    try {
      const url = `https://merchant-api.uairango.com/order/v1.0/orders/${orderId}`;
      const { data } = await axios.get(url, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-env': 'development',
          'x-api-key': `${process.env.API_KEY}`, 
        }
      });

      const eventoSimulado = {
        orderId: data.id,
        code: data.status,
        createdAt: data.createdAt
      };

      return data || []

    } catch (error: any) {     
      throw error.response?.data || error.message;
    }
  }


  async getPedidoDetalhes(tenantId: string, pedidoId: string, token: string) {
    try {
       const url = `https://merchant-api.uairango.com/order/v1.0/orders/${pedidoId}`;
      const response = await axios.get(`${url}`, {
        headers: {
          // Agora usamos o token que veio do banco
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-env': 'development',
          'x-api-key': `${process.env.API_KEY}`, 
          'tenant-id': tenantId
        }
      });

      return response.data;
      
    } catch (error: any) {     
      return error.response?.data || error.message; 
    }
}


async confirmarPedidoUaiRango(tenantId: string, token: string, orderId: string): Promise<any> {
  try {    

    // O Axios espera: post(url, body, config)
    const data = await axios.post(`https://merchant-api.uairango.com/order/v1.0/orders/${orderId}/confirm`,        
      {}, // <--- CORREÇÃO: Corpo vazio (ou o payload necessário)
      {
        headers: {          
          'Content-Type': 'application/json',          
          'Authorization': `Bearer ${token}`,
          'x-env': 'development',
          'x-api-key': `${process.env.API_KEY}`, 
          'tenant-id': tenantId
        }
      }
    );

    return data;

  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    // CORREÇÃO: O template string estava com um erro de sintaxe (faltava o pedidoId)
    console.error(`[UaiRango API] Erro ao confirmar pedido ${orderId}: ${status} - ${message}`);
    
    throw new Error(`Falha ao confirmar pedido na UaiRango: ${message}`);
  }
}


  async pedidoProntoRetirada(tenantId: string, config: any, orderId: string): Promise<any> {
  try {
    // Endpoint oficial de confirmação
    const url = `https://merchant-api.uairango.com/order/v1.0/orders/${orderId}/readyToPickup`;

    const response = await axios.post(
      url,
      {}, // Corpo vazio obrigatório para POST
      {
        headers: {
          // Usando o access_token que vem das configurações da empresa
          'Authorization': `Bearer ${config?.access_token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'x-env': 'development', // Ambiente de desenvolvimento
          'x-api-key': `${process.env.API_KEY}`, 
          'tenant-id': tenantId // O ID da empresa que está operando
        }
      }
    );

    return response.data;
  } catch (error: any) {
    // Log detalhado para identificar se o erro é 400 (regra de negócio) ou 401 (token)
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    console.error(`[UaiRango API] Erro no Confirm (${orderId}):`, {
      status,
      detalhes: errorData,
      message: error.message
    });
    
    // Lançamos um erro com a mensagem vinda da UaiRango se disponível
    const errorMessage = errorData?.message || "Erro desconhecido na API UaiRango";
    throw new Error(`Falha ao confirmar pedido: ${errorMessage}`);
  }
}


async despacharPedidoUaiRango(tenantId: string, config: any, orderId: string): Promise<any> {
  try {
    const url = `https://merchant-api.uairango.com/order/v1.0/orders/${orderId}/dispatch`;

    const response = await axios.post(
      url,
      {}, // Corpo vazio
      {
        headers: {
          'Authorization': `Bearer ${config?.access_token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'x-env': 'development',
          'x-api-key': `${process.env.API_KEY}`, 
          'tenant-id': tenantId
        }
      }
    );

    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    console.error(`[UaiRango API] Erro no Dispatch (${orderId}):`, {
      status,
      detalhes: errorData
    });
    
    const errorMessage = errorData?.message || "Erro ao despachar na API UaiRango";
    throw new Error(errorMessage);
  }
}

async dispatchPedidoUaiRango(tenantId: string, token: string, orderId: string): Promise<any> {
 
  try {
   
    const { data } = await axios.post(`https://merchant-api.uairango.com/order/v1.0/orders/${orderId}/dispatch`,
      {}, // Corpo vazio, a menos que a documentação exija algo específico
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'x-env': 'development', // Lembre-se de mudar para 'production' em breve
          'x-api-key': `${process.env.API_KEY}`,
          'tenant-id': tenantId
        }
      }
    );

    return data;

  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    console.error(`[UaiRango API] Erro ao despachar pedido ${orderId}: ${status} - ${message}`);
    throw new Error(`Falha ao despachar pedido na UaiRango: ${message}`);
  }
}


async readyToPickupUaiRango(tenantId: string, token: string, orderId: string): Promise<any> {
 
  try {
   
    const { data } = await axios.post(`hhttps://merchant-api.uairango.com/order/v1.0/orders/${orderId}/readyToPickup`,
      {}, // Corpo vazio, a menos que a documentação exija algo específico
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'x-env': 'development', // Lembre-se de mudar para 'production' em breve
          'x-api-key': `${process.env.API_KEY}`,
          'tenant-id': tenantId
        }
      }
    );

    return data;

  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    console.error(`[UaiRango API] Erro ao despachar pedido de retirada ${orderId}: ${status} - ${message}`);
    throw new Error(`Falha ao despachar pedido na UaiRango: ${message}`);
  }
}


}