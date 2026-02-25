import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { ConfigUaiRango } from '../entities/Empresas';

const prisma = new PrismaClient();

interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  type: string;
}

export class UaiRangoService {
  private readonly AUTH_URL = `${process.env.AUTH_URL}`;
  
  
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

  private async autenticar(config: ConfigUaiRango): Promise<AuthResponse> {
    const clientId = config.client_id?.trim();
    const secretKey = config.secret_key?.trim();

    if (!clientId || !secretKey) {
      throw new Error('Configuração client_id ou secret_key ausente no banco.');
    }

    // A UaiRango Merchant API costuma exigir CamelCase: grantType, clientId, clientSecret
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
          'x-api-key': `${process.env.API_KEY}`, 
        }
      });

      return data as AuthResponse;
    } catch (error: any) {   
      // Se continuar dando 401, o problema é a permissão da sua chave no portal UaiRango
      throw new Error(`Falha na autenticação: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
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
    const url = 'https://merchant-api.uairango.com/events/v1.0/events:polling?types=PLC,CFM,RTP,DSP,CAN&groups=ORDER_STATUS';
    
    const { data } = await axios.get(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-env': 'development',
        'x-api-key': `${process.env.API_KEY}`, 
      }
    });
    return data || [];
  }

  //Este metodo confirma que um evento foi recebido e processado, evitando que ele seja enviado novamente no polling

  async confirmarRecebimento(empresaId: string, config: ConfigUaiRango, eventIds: string[]) {
    const token = await this.getValidToken(empresaId, config);
    const url = 'https://merchant-api.uairango.com/events/v1.0/events/acknowledgment';
    
    const body = eventIds.map(eventId => ({ id: eventId }));
    await axios.post(url, body, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-env': 'development',
        'x-api-key': `${process.env.API_KEY}`
      }
    });
    return true;
  }

  async salvarPedidoNoBanco(tenantId: string, evento: any) {
    try {
      const { code, orderId, createdAt } = evento;

      const statusMap: Record<string, any> = {
        'PLC': 'RECEIVED',
        'CFM': 'CONFIRMED',
        'DSP': 'DISPATCHED',
        'CAN': 'CANCELLED',
        'RTP': 'READY_TO_PICKUP'
      };

      const statusFinal = statusMap[code] || 'RECEIVED';

      const pedidoSalvo = await prisma.pedido.upsert({
        where: { uairango_id: orderId },
        update: {
          status: statusFinal,
          updatedAt: new Date()
        },
        create: {
          uairango_id: orderId,          
          displayId: orderId.substring(0, 5).toUpperCase(),
          status: statusFinal,
          valorTotal: 0.0,
          tenant_id: tenantId,
          createdAt: new Date(createdAt),
        }
      });

      await prisma.pedidoHistorico.create({
        data: {
          pedido_id: pedidoSalvo.id,
          status: statusFinal,
          createdAt: new Date()
        }
      });
     
      return pedidoSalvo;

    } catch (error: any) { 
      throw error.message;
    }
  }

  async buscarPedidoPorId(empresaId: string, config: any, orderId: string) {
    const token = await this.getValidToken(empresaId, config);

    try {
      const url = `https://merchant-api.uairango.com/order/v1.0/orders/${orderId}`;
      const { data } = await axios.get(url, {
        headers: {
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

      return await this.salvarPedidoNoBanco(empresaId, empresaId,);
    } catch (error: any) {     
      throw error.response?.data || error.message;
    }
  }


  async getPedidoDetalhes(tenantId: string, pedidoId: string, token: string) {
    try {
      const response = await axios.get(`https://merchant-api.uairango.com/order/v1.0/orders/${pedidoId}`, {
        headers: {
          // Agora usamos o token que veio do banco
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


async confirmarPedidoUaiRango(tenantId:string, config: any, orderId: string): Promise<any> {

    try {
      // Endpoint oficial conforme fornecido
      const url = `https://merchant-api.uairango.com/order/v1.0/orders/${orderId}/confirm`;

      const response = await axios.post(
        url,
        {}, // O endpoint não exige corpo, apenas o ID na URL
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

      // Tratamento de erro detalhado para facilitar o debug no log
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      
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
}