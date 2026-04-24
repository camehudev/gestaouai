import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UaiRangoService } from '../../../core/services/UaiRangoService';
import { PedidoStatus } from 'core/entities/Pedidos';


const prisma = new PrismaClient();
const uaiService = new UaiRangoService();

export class UaiRangoController {

  async getTokenByTenant(req: Request, res: Response) {
    const { tenantId } = req.params;

    try {
      const empresa = await prisma.empresa.findFirst({
        where: { tenant_id: tenantId }
      });

      if (!empresa || !empresa.configUaiRango) {
        return res.status(404).json({ error: 'Configuração UaiRango não encontrada.' });
      }

      const token = await uaiService.getValidToken(empresa.id, empresa.configUaiRango as any);
      return res.json({ access_token: token });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  async getPolling(req: Request, res: Response) {
  const { tenantId } = req.params;

    try {
      // 1. Busca a empresa
      const empresa = await prisma.empresa.findFirst({
        where: { tenant_id: tenantId }
      });

      if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

      // --- EXTRAÇÃO DO TOKEN DO BANCO ---
      const config = empresa.configUaiRango as any;
      const tokenBanco = config?.token || config?.access_token; 

      if (!tokenBanco) {
        return res.status(400).json({ error: 'Token não encontrado nas configurações da empresa.' });
      }
      // ----------------------------------

      // 2. Busca os eventos (Polling)
      const eventos = await uaiService.buscarEventosPendentes(empresa.id, config); 
      
      const listaEventos = Array.isArray(eventos) ? eventos : (eventos.events || []);     

      if (listaEventos.length === 0) {
        return res.json({ mensagem: "Nenhum evento novo.", processados: 0, pedidos: [] });
      } 
      

      // 3. Processamento (Enriquecendo com detalhes)
      const pedidosDetalhados: any[] = [];  
      
   await uaiService.salvarPedidoNoBanco(tenantId, eventos ) 

        
    // 4. Retorno dos dados enriquecidos
      return res.json({
        status: 200,
        recebidos: listaEventos.length,
        processados: pedidosDetalhados.length,
        pedidos: eventos,
        
      });
   

  } catch (error: any) {   
    return res.status(500).json({ error});
  }
}

 
 // No seu PedidoController.ts (Backend)
async confirmarProcessamentoPelaRota(req: Request, res: Response) {
  try {
    const { tenantId } = req.params;
    const { eventIds } = req.body; // ["id123"]

    // 1. Busca a empresa e as configs do banco (Prisma)
    const empresa = await prisma.empresa.findFirst({ where: { tenant_id: tenantId } });
    if (!empresa) return res.status(404).json({ error: "Empresa não encontrada" });

    // 2. Chama o método que você criou (o que usa Merchant API da UaiRango)
   await uaiService.confirmarRecebimento(
      empresa.id, 
      empresa.configUaiRango as any, 
      eventIds
    );  

    return res.json({sucesso: true, mensagem: "Pedido confirmado na UaiRango!" });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

 async getDetails(req: Request, res: Response) {  
    try {
      const {id, orderId  } = req.params; // ID do pedido
             
      const tenantId = req.headers['tenant-id'] as string;     
     
      if (!tenantId) {
        return res.status(400).json({ error: "O header 'tenant-id' é obrigatório." });
      }

      // 1. Busca a empresa no banco para obter o token
      const empresa = await prisma.empresa.findFirst({
        where: { tenant_id: tenantId }
      });

      if (!empresa) {
        return res.status(404).json({ error: "Empresa não encontrada para este tenant-id." });
      }

      // 2. Extrai o token das configurações
      const config = empresa.configUaiRango as any;
      const tokenBanco = config?.token || config?.access_token;

      if (!tokenBanco) {
        return res.status(400).json({ error: "Token de autenticação não encontrado no banco." });
      }

      // 3. Agora chama o service passando os 3 argumentos: tenantId, pedidoId e o Token
      const detalhes = await uaiService.getPedidoDetalhes(tenantId, orderId, tokenBanco);
      
      if (!detalhes) {
        return res.status(404).json({ error: "Pedido não encontrado na UaiRango ou token inválido." });
      }
     
     const result =  await uaiService.salvarDetalhesNoBanco(tenantId,detalhes, id)

     if(result.status === 200){

       return res.json({
        status: 200,
        message: `Pedido Salvo com sucesso!`,
        data:detalhes

       })
      
     }



      
    } catch (error: any) {   
      return res.status(400).json({ error: error.message });
    }
}

async confirmarAceite(req: Request, res: Response) {
  const { orderId } = req.params; 
  // O tenant aqui deve ser o ID da empresa no SEU banco de dados (UUID)
  const tenantId = (req.headers['tenantid'] || req.headers['tenant-id']) as string; 

  try {
    // 1. Busca a empresa
    const empresa = await prisma.empresa.findFirst({
      where: { tenant_id: tenantId } // Certifique-se que o campo no banco chama tenant_id
    });

    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

    // 2. Obtém o token válido (o Service deve retornar apenas a string do token)
    const token = await uaiService.getValidToken(tenantId, empresa.configUaiRango as any);   
  
    // 3. Chama o Service passando:
    // O tenantId (da empresa), o token (obtido) e o orderId (vindo da URL)
    await uaiService.confirmarPedidoUaiRango(tenantId, token, orderId); 

    return res.json({ message: "Sucesso!" });

  } catch (error: any) {
    console.error(error); // Log importante para debugar
    return res.status(error.response?.status || 500).json({ 
        error: error.message || 'Erro ao processar confirmação' 
    });
  }
}

async marcarComoPronto(req: Request, res: Response) {
  const { orderId } = req.params;
  const tenant = req.headers.tenantid || req.headers['x-tenant-id'];
  const tenantId = tenant?.toString();

  try {
    const empresa = await prisma.empresa.findUnique({ where: { id: tenantId } });
    if (!empresa) return res.status(404).json({ error: "Empresa não encontrada." });

    // Chamada para o novo método do Service
    await uaiService.pedidoProntoRetirada(tenantId!, empresa.configUaiRango, orderId);

    // Opcional: Atualizar status local
    // await prisma.pedido.update({ where: { uairango_id: orderId }, data: { status: 'READY' } });

    return res.json({ success: true, message: "Pedido pronto para retirada!" });
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    return res.status(statusCode).json({ 
      error: error.message 
    });
  }
}

async despacharPedido(req: Request, res: Response) {
  const { orderId } = req.params;
  const tenant = req.headers.tenantid || req.headers['x-tenant-id'];
  const tenantId = tenant?.toString();

  if (!tenantId) return res.status(400).json({ error: "Tenant ID ausente." });

  try {
    const empresa = await prisma.empresa.findUnique({ where: { id: tenantId } });
    if (!empresa) return res.status(404).json({ error: "Empresa não encontrada." });

    // 1. Notifica a UaiRango
    await uaiService.despacharPedidoUaiRango(tenantId, empresa.configUaiRango, orderId);

    // 2. Atualiza o banco local
    await prisma.pedido.update({
      where: { uairango_id: orderId },
      data: { fullCode: PedidoStatus.DISPATCHED }
    });

    return res.json({ success: true, message: "Pedido marcado como 'Em Trânsito'!" });
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    return res.status(statusCode).json({ error: error.message });
  }
}

async dispatchAceite(req: Request, res: Response) {
  const { orderId } = req.params;
  const tenantId = (req.headers['tenantid'] || req.headers['tenant-id']) as string;

  try {
    // 1. Busca o pedido para obter o ID real da UaiRango (externalId)
    // const pedido = await prisma.pedido.findUnique({
    //   where: { id: orderId }
    // });

    // if (!pedido || !pedido.uairango_id) {
    //   return res.status(404).json({ error: 'Pedido não encontrado ou ID UaiRango ausente.' });
    // }

    // 2. Busca a empresa e o Token
    const empresa = await prisma.empresa.findFirst({
      where: { tenant_id: tenantId }
    });

    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

    const token = await uaiService.getValidToken(tenantId, empresa.configUaiRango as any);

    // 3. Chama o Service de Despacho usando o ID da UaiRango
    const resultado = await uaiService.dispatchPedidoUaiRango(tenantId, token, orderId);
    
    // 4. (Opcional) Atualiza o status local no seu banco de dados
    // await prisma.pedido.update({
    //   where: { id: orderId },
    //   data: { fullCode: PedidoStatus.DISPATCHED }
    // });

    return res.json({ 
      message: "Pedido despachado com sucesso!", 
      data: resultado 
    });

  } catch (error: any) {
    console.error(`[Controller Error] Erro ao despachar pedido ${orderId}:`, error);
    
    // Retorna o status da API se disponível, ou 500
    return res.status(error.response?.status || 500).json({ 
        error: error.message || 'Erro ao processar despacho na UaiRango' 
    });
  }
}

async readyToPickupAceite(req: Request, res: Response) {

  const { orderId } = req.params;
  const tenantId = (req.headers['tenantid'] || req.headers['tenant-id']) as string;

  try {
    // 1. Busca o pedido para obter o ID real da UaiRango (externalId)
    // const pedido = await prisma.pedido.findUnique({
    //   where: { id: orderId }
    // });

    // if (!pedido || !pedido.uairango_id) {
    //   return res.status(404).json({ error: 'Pedido não encontrado ou ID UaiRango ausente.' });
    // }

    // 2. Busca a empresa e o Token
    const empresa = await prisma.empresa.findFirst({
      where: { tenant_id: tenantId }
    });

    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

    const token = await uaiService.getValidToken(tenantId, empresa.configUaiRango as any);

    // 3. Chama o Service de Despacho usando o ID da UaiRango
    const resultado = await uaiService.readyToPickupUaiRango(tenantId, token, orderId);
    
    // 4. (Opcional) Atualiza o status local no seu banco de dados
    // await prisma.pedido.update({
    //   where: { id: orderId },
    //   data: { fullCode: PedidoStatus.DISPATCHED }
    // });

    return res.json({ 
      message: "Pedido pronto para retirada com sucesso!", 
      data: resultado 
    });

  } catch (error: any) {
    console.error(`[Controller Error] Erro ao despachar pedido(Retirada Local) ${orderId}:`, error);
    
    // Retorna o status da API se disponível, ou 500
    return res.status(error.response?.status || 500).json({ 
        error: error.message || 'Erro ao processar despacho na UaiRango' 
    });
  }
}

}