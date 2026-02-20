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
  private readonly AUTH_URL = 'https://merchant-api.uairango.com/authentication/v1.0/oauth/token'; 
  private readonly URL_MERCHANTS = 'https://merchant-api.uairango.com/merchant/v1.0/merchants';

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
          'x-env': 'development'
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
}