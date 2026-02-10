import { Pedido } from "../entities/Pedidos";

export interface IPedidoRepository {
  save(pedido: Pedido): Promise<void>;
  findById(id: string, tenantId: string): Promise<Pedido | null>;
  findByExternalId(externalId: string, tenantId: string): Promise<Pedido | null>;
  updateStatus(id: string, status: string, tenantId: string): Promise<void>;
}