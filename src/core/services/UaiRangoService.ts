import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { ConfigUaiRango } from '../entities/Empresas';
import { config } from 'process';

const prisma = new PrismaClient();

interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  type: string;
}

export class UaiRangoService {
  private readonly AUTH_URL = 'https://merchant-api.uairango.com/authentication/v1.0/oauth/token';

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
          'x-env': 'development' 
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
        'x-env': 'development'
      }
    });
    return data || [];
  }

  async confirmarRecebimento(empresaId: string, config: ConfigUaiRango, eventIds: string[]) {
    const token = await this.getValidToken(empresaId, config);
    const url = 'https://merchant-api.uairango.com/events/v1.0/events/acknowledgment';
    
    const body = eventIds.map(eventId => ({ id: eventId }));
    await axios.post(url, body, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-env': 'development'
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
          externalId: orderId,
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
          'x-env': 'development'
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
          'x-api-key': process.env.API_KEY, 
          'tenant-id': tenantId
        }
      });

      return response.data;
      
    } catch (error: any) {     
      return error.response?.data || error.message; 
    }
}
  



}