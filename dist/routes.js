"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const UaiRangoController_1 = require("./infrastructure/http/controllers/UaiRangoController");
const auth_middleware_1 = require("./middlewares/auth-middleware");
exports.router = (0, express_1.Router)();
const uaiController = new UaiRangoController_1.UaiRangoController();
// Todas as rotas abaixo deste middleware exigirão a x-api-key
exports.router.use('/uairango/v1', auth_middleware_1.authMiddleware);
/**
 * Definição das rotas da UaiRango
 * Note que agora apenas apontamos para o método do Controller
 */
exports.router.post('/uairango/v1/confirmar/:tenantId', (req, res) => uaiController.confirmarProcessamentoPelaRota(req, res));
exports.router.get('/uairango/v1/token/:tenant_id', (req, res) => uaiController.getTokenByTenant(req, res));
exports.router.get('/uairango/v1/pedidos/:tenantId', (req, res) => uaiController.getPolling(req, res));
exports.router.get('/uairango/pedido/:id', uaiController.getDetails);
// Futura rota de pedidos que você vai precisar para a homologação:
// router.get('/uairango/pedidos/:tenantId', (req, res) => uaiController.getOrders(req, res));
exports.default = exports.router;
