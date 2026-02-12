"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usuario = void 0;
class Usuario {
    constructor(id, nome, email, tenant_id, // Movido para antes dos opcionais
    senha, // Opcional
    createdAt // Opcional
    ) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.tenant_id = tenant_id;
        this.senha = senha;
        this.createdAt = createdAt;
    }
    // Exemplo de Regra de Negócio: Validar e-mail
    validarEmail() {
        const regex = /\S+@\S+\.\S+/;
        return regex.test(this.email);
    }
    // Regra de Negócio: Ocultar dados sensíveis
    exporDadosPublicos() {
        return {
            id: this.id,
            nome: this.nome,
            email: this.email,
            tenant_id: this.tenant_id
        };
    }
}
exports.Usuario = Usuario;
