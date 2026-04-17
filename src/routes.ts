import { Router } from 'express';
import { UaiRangoController } from './infrastructure/http/controllers/UaiRangoController';
import { authMiddleware } from './middlewares/auth-middleware';
import { MerchantController } from '../src/infrastructure/http/controllers/merchante/MerchantController';
import { UserController } from '../src/infrastructure/http/controllers/UserController';
import { AuthController } from '../src/infrastructure/http/controllers/AuthController';
import { loginLimiter } from './middlewares/auth-limiter';
import { createUserSchema, loginSchema } from './schemas/userSchema';
import { validate } from './middlewares/validateMiddleware';
import jwt from 'jsonwebtoken';


export const router = Router();
const uaiController = new UaiRangoController();
const merchantController = new MerchantController();
const userController = new UserController();
const authController = new AuthController();

// Todas as rotas abaixo deste middleware exigirão a x-api-key
router.use('/uairango/v1', authMiddleware);

/**
 * Definição das rotas da UaiRango
 * Note que agora apenas apontamos para o método do Controller
 */


router.post('/pedidos/confirmar/:tenantId', (req, res) => uaiController.confirmarProcessamentoPelaRota(req, res));
/**router.post("/pedidos/:orderId/confirmar",(req,res)=> uaiController.confirmarAceite(req,res));
router.get('/uairango/v1/token/:tenant_id', (req, res) => uaiController.getTokenByTenant(req, res));
router.get('/uairango/v1/pedidos/:tenantId', (req, res) => uaiController.getPolling(req, res));
router.get('/uairango/pedido/:id', uaiController.getDetails); */

// Rota para validar token
router.get('/token/:tenant_id', (req, res) => uaiController.getTokenByTenant(req, res));

// Rota para iniciar o processo de vínculo
router.post('/:empresaId/auth/user-code', merchantController.getUserCode.bind(merchantController));

// Sugestão de Padronização:
router.get('/pedidos/:tenantId', (req, res) => uaiController.getPolling(req, res));

router.get('/order/pedido/:id', uaiController.getDetails);

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
// Rota para pausar/ativar itens
router.patch('/:empresaId/items/:merchantId/status', merchantController.updateItemStatus.bind(merchantController));
// Rota para atualização de preço de complementos (Options)
router.patch('/:empresaId/options/:merchantId/price', merchantController.updateOptionPrice.bind(merchantController));
// Rota para alterar status de complementos (Disponível/Indisponível)
router.patch('/:empresaId/options/:merchantId/status', merchantController.updateOptionStatus.bind(merchantController));


// NOVA ROTA PAR AATUALIZAÇÃO DE STATUS /uairango/v1/config/EMPRESA_DO_BANCO/merchant/ID_DA_UAIRANGO
router.put('/config/:empresaId/merchant/:merchantId', (req, res) => merchantController.updateStatusLoja(req, res));

// ROTA DE USUÁRIOS

// 1. Criar um novo usuário para uma empresa específica
router.post('/:empresaId/users',validate(createUserSchema), userController.store.bind(userController));

// 2. Listar todos os usuários de uma empresa específica
router.get('/:empresaId/users', userController.index.bind(userController));

// 3. Buscar os detalhes de um único usuário
router.get('/:empresaId/users/:id', userController.show.bind(userController));

// 4. Deletar um usuário de uma empresa
router.delete('/:empresaId/users/:id', userController.delete.bind(userController));

// Rota pública de login
router.post('/login',loginLimiter,validate(loginSchema),authController.authenticate.bind(authController));
//validate(loginSchema),

router.get('/me', (req, res) => {
  // 1. O cookie-parser pega o cookie 'token' que você salvou no Login
  const token = req.cookies.token; 

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    // 2. Valida se o token é verdadeiro e não expirou
    // Use a mesma SECRET_KEY que você usou no login
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');

    // 3. Se deu certo, retorna os dados básicos (ou apenas um OK)
    return res.json({ 
      user: decoded, 
      authenticated: true 
    });

  } catch (err) {
    // Se o token for inválido ou expirado, limpamos o cookie
    res.clearCookie('token');
    return res.status(401).json({ error: 'Sessão expirada' });
  }
});

router.post('/logout', (req, res) => {
  // Limpa o cookie chamado 'token'
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/' // Garante que limpe em todas as rotas
  });

  return res.status(200).json({ message: 'Logout realizado com sucesso!' });
});

// DESPACHAR UM PEDIDO ENTREGA OU DELIVERY

// Rota para despachar pedido (pronto para entrega em Delivery)
router.post('/despachar/:orderId', uaiController.dispatchAceite);

// Rota para despachar pedido (pronto para retirada)
router.post('/readyToPickup/:orderId', uaiController.readyToPickupAceite);



export default router;