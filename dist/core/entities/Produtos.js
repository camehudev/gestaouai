"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Produto = void 0;
class Produto {
    constructor(id, nome, tenant_id, externalId, externalCode, description, serving, weightQuantity // Mapeamos o quantity aqui
    ) {
        this.id = id;
        this.nome = nome;
        this.tenant_id = tenant_id;
        this.externalId = externalId;
        this.externalCode = externalCode;
        this.description = description;
        this.serving = serving;
        this.weightQuantity = weightQuantity;
    }
}
exports.Produto = Produto;
