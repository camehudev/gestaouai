import { PrismaClient } from '@prisma/client';
import { Empresa } from '../entities/Empresas';

const prisma = new PrismaClient();

export class PrismaEmpresaRepository {
  // Busca a empresa para obter as configurações da UaiRango
  async buscarPorId(id: string): Promise<Empresa | null> {
    const registro = await prisma.empresa.findUnique({
      where: { id }
    });

    if (!registro) return null;

    // Mapeia o retorno do Prisma para a sua Entidade Empresa
    return new Empresa(
      registro.id,
      registro.nome,
      registro.cnpj,
      registro.tokenUai || undefined,
      registro.configUaiRango as any // Aqui estão o seu ClientId e Secret
    );
  }

  // Método para salvar/atualizar as credenciais que você recebeu
  async atualizarConfiguracaoUai(id: string, config: any) {
    return await prisma.empresa.update({
      where: { id },
      data: { configUaiRango: config }
    });
  }
}