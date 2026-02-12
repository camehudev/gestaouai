"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaEmpresaRepository = void 0;
const client_1 = require("@prisma/client");
const Empresas_1 = require("../entities/Empresas");
const prisma = new client_1.PrismaClient();
class PrismaEmpresaRepository {
    // Busca a empresa para obter as configurações da UaiRango
    async buscarPorId(id) {
        const registro = await prisma.empresa.findUnique({
            where: { id }
        });
        if (!registro)
            return null;
        // Mapeia o retorno do Prisma para a sua Entidade Empresa
        return new Empresas_1.Empresa(registro.id, registro.nome, registro.cnpj, registro.tokenUai || "", registro.configUaiRango // Aqui estão o seu ClientId e Secret
        );
    }
    // Método para salvar/atualizar as credenciais que você recebeu
    async atualizarConfiguracaoUai(id, config) {
        return await prisma.empresa.update({
            where: { id },
            data: { configUaiRango: config }
        });
    }
}
exports.PrismaEmpresaRepository = PrismaEmpresaRepository;
