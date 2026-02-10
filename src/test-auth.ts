import { PrismaClient } from '@prisma/client';
import { UaiRangoService } from './core/services/UaiRangoService';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const uaiService = new UaiRangoService();

async function testarConexao() {
  try {

    // 1. Busca a empresa pelo CNPJ
    const empresaNoBanco = await prisma.empresa.findFirst({
      where: { cnpj: '36.910.316/0001-68' }
    });

    if (!empresaNoBanco || !empresaNoBanco.configUaiRango) {
      console.error('❌ Erro: Empresa não encontrada ou configUaiRango ausente no banco.');
      return;
    }

    // 2. Preparando a config (Tratando como 'any' para facilitar o acesso ao JSONB)
    const config = empresaNoBanco.configUaiRango as any;
      
    // 3. Obtendo o token
    // Como definimos no Service que retorna Promise<string>, o TS não vai reclamar
    const accessToken = await uaiService.getValidToken(empresaNoBanco.id, config);   

    // Verificação de segurança extra
    if (!accessToken) {
        throw new Error("O service retornou um valor vazio para o token.");
    }
  
  } catch (error: any) {
    console.error('❌ FALHA NO TESTE:');
    
    // Exibe a mensagem de erro detalhada que configuramos no Service
    console.error(error.message);

    // Se houver detalhes extras de resposta da API (Axios)
    if (error.response?.data) {
      console.error('DADOS DA API:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

testarConexao();