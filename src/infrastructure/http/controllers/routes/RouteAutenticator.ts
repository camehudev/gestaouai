import { Router, Request, Response } from 'express';
import { UaiRangoService } from '../../../../core/services/UaiRangoService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const uaiService = new UaiRangoService();

router.post('/sincronizar/:empresaId', async (req: Request, res: Response) => {
  const { empresaId } = req.params;

  try {
    // 1. Busca a empresa e as configurações no banco
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId }
    });

    if (!empresa || !empresa.configUaiRango) {
      return res.status(404).json({ error: 'Configurações da UaiRango não encontradas para esta empresa.' });
    }

    // 2. Obtém o token (o service cuida do cache ou gera um novo)
    const config = empresa.configUaiRango as any;
    const accessToken = await uaiService.getValidToken(empresa.id, config);

    // 3. (Opcional por enquanto) Busca o cardápio para confirmar que o token funciona
    // Se você ainda não adicionou o método sincronizarProdutos, pode pular esta parte
    // const cardapio = await uaiService.sincronizarProdutos(accessToken);

    return res.status(200).json({
      message: 'Autenticação realizada com sucesso!',
      token_preview: accessToken.substring(0, 10) + '...',
      // cardapio: cardapio // Descomente quando tiver o método pronto
    });

  } catch (error: any) {
    console.error('Erro na rota de sincronização:', error.message);
    return res.status(500).json({ 
      error: 'Falha ao conectar com UaiRango', 
      details: error.message 
    });
  }
});

export default router;