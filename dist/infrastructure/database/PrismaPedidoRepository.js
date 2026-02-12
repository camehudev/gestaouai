"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaPedidoRepository = void 0;
const Pedidos_1 = require("../../core/entities/Pedidos");
const prisma_1 = require("../../prisma");
class PrismaPedidoRepository {
    async save(pedido) {
        await prisma_1.prisma.pedido.upsert({
            where: { uairango_id: pedido.externalId }, // Usando o ID da UaiRango como chave única
            update: {
                status: pedido.status,
                valorTotal: pedido.valorTotal,
                updatedAt: new Date()
            },
            create: {
                id: pedido.id,
                uairango_id: pedido.externalId, // <--- ADICIONADO: O Prisma estava reclamando da falta deste campo        
                displayId: pedido.externalId.substring(0, 5).toUpperCase(), // Útil para painéis de cozinha
                tenant_id: pedido.tenant_id,
                status: pedido.status,
                valorTotal: pedido.valorTotal,
                createdAt: pedido.createdAt || new Date(),
            }
        });
    }
    async findByExternalId(externalId, tenantId) {
        const data = await prisma_1.prisma.pedido.findFirst({
            where: {
                uairango_id: externalId, // Buscamos pelo ID da UaiRango
                tenant_id: tenantId
            }
        });
        if (!data)
            return null;
        return new Pedidos_1.Pedido(data.id, data.uairango_id, // Mapeando de volta para a entidade
        data.tenant_id, data.status, Number(data.valorTotal), data.createdAt);
    }
    async updateStatus(id, status, tenantId) {
        await prisma_1.prisma.pedido.updateMany({
            where: {
                id: id,
                tenant_id: tenantId
            },
            data: { status: status }
        });
    }
    async findById(id, tenantId) {
        const data = await prisma_1.prisma.pedido.findUnique({
            where: { id }
        });
        if (!data || data.tenant_id !== tenantId)
            return null;
        return new Pedidos_1.Pedido(data.id, data.uairango_id, data.tenant_id, data.status, Number(data.valorTotal), data.createdAt);
    }
}
exports.PrismaPedidoRepository = PrismaPedidoRepository;
