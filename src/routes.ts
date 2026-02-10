import { Router } from 'express';
import { UaiRangoController } from '../src/infrastructure/http/controllers/UaiRangoController';
import { authMiddleware } from './middlewares/auth-middleware';

export const router = Router();
const uaiController = new UaiRangoController();

// Todas as rotas abaixo deste middleware exigirão a x-api-key
router.use('/uairango/v1', authMiddleware);

/**
 * Definição das rotas da UaiRango
 * Note que agora apenas apontamos para o método do Controller
 */


router.post('/uairango/v1/confirmar/:tenantId', (req, res) => uaiController.confirmarProcessamentoPelaRota(req, res));
router.get('/uairango/v1/token/:tenant_id', (req, res) => uaiController.getTokenByTenant(req, res));
router.get('/uairango/v1/pedidos/:tenantId', (req, res) => uaiController.getPolling(req, res));
router.get('/uairango/pedido/:id', uaiController.getDetails);


// Futura rota de pedidos que você vai precisar para a homologação:
// router.get('/uairango/pedidos/:tenantId', (req, res) => uaiController.getOrders(req, res));

export default router;