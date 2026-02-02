import { IPedidoRepository } from '../../core/repositories/IPedidoRepository';
import { Pedido, PedidoStatus } from '../../core/entities/Pedido';
import { prisma } from './prisma';

export class PrismaPedidoRepository implements IPedidoRepository {
  
  async save(pedido: Pedido): Promise<void> {
    await prisma.pedido.create({
      data: {
        id: pedido.id,
        externalId: pedido.externalId,
        tenantId: pedido.tenantId,
        status: pedido.status as any, // Cast para o Enum do Prisma
        valorTotal: pedido.valorTotal,
        createdAt: pedido.createdAt,
      }
    });
  }

  async findByExternalId(externalId: string, tenantId: string): Promise<Pedido | null> {
    const data = await prisma.pedido.findFirst({
      where: { externalId, tenantId }
    });

    if (!data) return null;

    // Converte o modelo do Prisma de volta para a Entidade de Domínio
    return new Pedido(
      data.id,
      data.externalId,
      data.tenantId,
      data.status as PedidoStatus,
      Number(data.valorTotal),
      data.createdAt
    );
  }

  async updateStatus(id: string, status: PedidoStatus, tenantId: string): Promise<void> {
    await prisma.pedido.updateMany({
      where: { id, tenantId },
      data: { status: status as any }
    });
  }

  async findById(id: string, tenantId: string): Promise<Pedido | null> {
    const data = await prisma.pedido.findUnique({
      where: { id } // O findUnique exige o ID, mas validamos o tenantId abaixo
    });

    if (!data || data.tenantId !== tenantId) return null;

    return new Pedido(
      data.id,
      data.externalId,
      data.tenantId,
      data.status as PedidoStatus,
      Number(data.valorTotal),
      data.createdAt
    );
  }
}