"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pedido = exports.PedidoStatus = void 0;
var PedidoStatus;
(function (PedidoStatus) {
    PedidoStatus["RECEIVED"] = "RECEIVED";
    PedidoStatus["CONFIRMED"] = "CONFIRMED";
    PedidoStatus["DISPATCHED"] = "DISPATCHED";
    PedidoStatus["READY"] = "READY";
    PedidoStatus["CANCELLED"] = "CANCELLED";
})(PedidoStatus || (exports.PedidoStatus = PedidoStatus = {}));
class Pedido {
    constructor(id, externalId, tenant_id, // Unificado com o padrão do banco
    status, valorTotal, createdAt, displayId, // Adicionado para o ID amigável da UaiRango
    usuarioId, motivoCancelamentoId // UUID para seguir o padrão
    ) {
        this.id = id;
        this.externalId = externalId;
        this.tenant_id = tenant_id;
        this.status = status;
        this.valorTotal = valorTotal;
        this.createdAt = createdAt;
        this.displayId = displayId;
        this.usuarioId = usuarioId;
        this.motivoCancelamentoId = motivoCancelamentoId;
    }
    // Regra de negócio: Garante integridade antes de chamar o banco
    podeSerCancelado() {
        const statusNaoCancelaveis = [PedidoStatus.DISPATCHED, PedidoStatus.CANCELLED];
        return !statusNaoCancelaveis.includes(this.status);
    }
}
exports.Pedido = Pedido;
