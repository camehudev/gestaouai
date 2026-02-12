"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const UaiRangoService_1 = require("./core/services/UaiRangoService");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const prisma = new client_1.PrismaClient();
const uaiService = new UaiRangoService_1.UaiRangoService();
async function testarConexao() {
    try {
        // 1. Busca a empresa pelo CNPJ
        const empresaNoBanco = await prisma.empresa.findFirst({
            where: { cnpj: '36.910.316/0001-68' }
        });
        if (!empresaNoBanco || !empresaNoBanco.configUaiRango) {
            console.error('❌ Erro: Empresa não encontrada ou configUaiRango ausente no banco.');
            return;
        }
        // 2. Preparando a config (Tratando como 'any' para facilitar o acesso ao JSONB)
        const config = empresaNoBanco.configUaiRango;
        // 3. Obtendo o token
        // Como definimos no Service que retorna Promise<string>, o TS não vai reclamar
        const accessToken = await uaiService.getValidToken(empresaNoBanco.id, config);
        // Verificação de segurança extra
        if (!accessToken) {
            throw new Error("O service retornou um valor vazio para o token.");
        }
    }
    catch (error) {
        console.error('❌ FALHA NO TESTE:');
        // Exibe a mensagem de erro detalhada que configuramos no Service
        console.error(error.message);
        // Se houver detalhes extras de resposta da API (Axios)
        if (error.response?.data) {
            console.error('DADOS DA API:', JSON.stringify(error.response.data, null, 2));
        }
    }
    finally {
        await prisma.$disconnect();
    }
}
testarConexao();
