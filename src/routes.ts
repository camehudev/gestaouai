import { Router } from 'express';
import { UaiRangoController } from './infrastructure/http/controllers/UaiRangoController';
import { authMiddleware } from './middlewares/auth-middleware';
import { MerchantController } from 'infrastructure/http/controllers/merchante/MerchantController';

export const router = Router();
const uaiController = new UaiRangoController();
const merchantController = new MerchantController();

// Todas as rotas abaixo deste middleware exigirão a x-api-key
router.use('/uairango/v1', authMiddleware);

/**
 * Definição das rotas da UaiRango
 * Note que agora apenas apontamos para o método do Controller
 */


/**router.post('/uairango/v1/confirmar/:tenantId', (req, res) => uaiController.confirmarProcessamentoPelaRota(req, res));
router.post("/pedidos/:orderId/confirmar",(req,res)=> uaiController.confirmarAceite(req,res));
router.get('/uairango/v1/token/:tenant_id', (req, res) => uaiController.getTokenByTenant(req, res));
router.get('/uairango/v1/pedidos/:tenantId', (req, res) => uaiController.getPolling(req, res));
router.get('/uairango/pedido/:id', uaiController.getDetails); */

// Sugestão de Padronização:
router.get('/pedidos/:tenantId', (req, res) => uaiController.getPolling(req, res));
router.get('/pedido/:id', uaiController.getDetails);

// Mude esta linha para incluir o prefixo se desejar:
router.post('/pedidos/:orderId/confirmar', (req, res) => uaiController.confirmarAceite(req, res));

// O ":orderId" é um parâmetro dinâmico que o Controller lerá em req.params
router.post("/pedidos/:orderId/readyToPickup", (req, res) => uaiController.marcarComoPronto(req, res)
);

router.post("/pedidos/:orderId/despachar",(req, res) => uaiController.despacharPedido(req, res)
);
// Exemplo de chamada: GET http://localhost:3000/merchants/ID-DA-EMPRESA
router.get('/merchants/:empresaId', (req, res, next) => {merchantController.listAllMerchant(req, res);
});

// Rota para detalhes de uma loja específica
router.get('/merchants/details/:merchantId/:empresaId', merchantController.getById.bind(merchantController));

// Rota para status da loja
router.get('/:empresaId/status/:merchantId', merchantController.getStatus.bind(merchantController));

// Rota para status específico de Delivery
router.get('/:empresaId/status/:merchantId/delivery', merchantController.getDeliveryStatus.bind(merchantController));

// Rota para modificar status (Abrir/Fechar loja)
router.patch('/:empresaId/status/:merchantId', merchantController.updateStatus.bind(merchantController));

// ROTAS PAR O CATALOGO DE PRODUTOS

    // Rota para listar catálogos
    router.get('/:empresaId/catalogs/:merchantId', merchantController.getCatalogs.bind(merchantController));
    // Rota para pegar o cardápio completo (Categorias + Itens)
    router.get('/:empresaId/catalogs/:merchantId/:catalogId/items', merchantController.getCatalogDetails.bind(merchantController));
    // Rota para criar categoria (POST)
    router.post('/:empresaId/catalogs/:merchantId/:catalogId/categories', merchantController.createCategory.bind(merchantController));

// Rota para Upsert de Item Completo
  router.post('/:empresaId/items-full/:merchantId', merchantController.upsertItem.bind(merchantController));

    // Rota para editar preço
  router.post('/:empresaId/items/:merchantId/price', merchantController.updatePrice.bind(merchantController));


export default router;