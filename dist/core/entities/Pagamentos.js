"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagamento = void 0;
class Pagamento {
    constructor(id, pedidoId, tipo, bandeiraCartao, valorTroco, cupomCodigo, cupomValor, tenant_id) {
        this.id = id;
        this.pedidoId = pedidoId;
        this.tipo = tipo;
        this.bandeiraCartao = bandeiraCartao;
        this.valorTroco = valorTroco;
        this.cupomCodigo = cupomCodigo;
        this.cupomValor = cupomValor;
        this.tenant_id = tenant_id;
    }
}
exports.Pagamento = Pagamento;
