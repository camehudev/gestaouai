"use strict";
// src/core/entities/Empresa.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Empresa = void 0;
class Empresa {
    constructor(id, nome, cnpj, tenant_id, tokenUai, // 4º parâmetro
    configUaiRango, // 5º parâmetro (O que estava faltando)
    createdAt // 6º parâmetro (Opcional)
    ) {
        this.id = id;
        this.nome = nome;
        this.cnpj = cnpj;
        this.tenant_id = tenant_id;
        this.tokenUai = tokenUai;
        this.configUaiRango = configUaiRango;
        this.createdAt = createdAt;
    }
}
exports.Empresa = Empresa;
