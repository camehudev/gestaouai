import { IPedidoRepository } from '../../core/repositories/IPedidoRepository';
import { Pedido, PedidoStatus } from '../../core/entities/Pedidos';
import { prisma } from '../../prisma'; 

export class PrismaPedidoRepository implements IPedidoRepository {
  
  async save(pedido: Pedido): Promise<void> {
    await prisma.pedido.upsert({
      where: { uairango_id: pedido.externalId }, // Usando o ID da UaiRango como chave única
      update: {
        status: pedido.status as any,
        valorTotal: pedido.valorTotal,
        updatedAt: new Date()
      },
      create: {
        id: pedido.id,
        uairango_id: pedido.externalId, // <--- ADICIONADO: O Prisma estava reclamando da falta deste campo
        externalId: pedido.externalId,
        displayId: pedido.externalId.substring(0, 5).toUpperCase(), // Útil para painéis de cozinha
        tenant_id: pedido.tenant_id,
        status: pedido.status as any,
        valorTotal: pedido.valorTotal,
        createdAt: pedido.createdAt || new Date(),
      }
    });
  }

  async findByExternalId(externalId: string, tenantId: string): Promise<Pedido | null> {
    const data = await prisma.pedido.findFirst({
      where: { 
        uairango_id: externalId, // Buscamos pelo ID da UaiRango
        tenant_id: tenantId 
      }
    });

    if (!data) return null;

    return new Pedido(
      data.id,
      data.uairango_id, // Mapeando de volta para a entidade
      data.tenant_id,
      data.status as PedidoStatus,
      Number(data.valorTotal),
      data.createdAt
    );
  }

  async updateStatus(id: string, status: PedidoStatus, tenantId: string): Promise<void> {
    await prisma.pedido.updateMany({
      where: { 
        id: id, 
        tenant_id: tenantId 
      },
      data: { status: status as any }
    });
  }

  async findById(id: string, tenantId: string): Promise<Pedido | null> {
    const data = await prisma.pedido.findUnique({
      where: { id }
    });

    if (!data || data.tenant_id !== tenantId) return null;

    return new Pedido(
      data.id,
      data.uairango_id,
      data.tenant_id,
      data.status as PedidoStatus,
      Number(data.valorTotal),
      data.createdAt
    );
  }
}