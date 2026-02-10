import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UaiRangoService } from '../../../core/services/UaiRangoService';

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
      const eventosParaConfirmar: string[] = []; // Criamos uma lista de IDs para o ACK

      for (const evento of listaEventos) {
        try {
          // 1. Tente pegar o orderId primeiro. Se não existir, use o id.
          //onst orderId = evento.orderId || evento.order?.id || evento.id;   
          
          await uaiService.salvarPedidoNoBanco(empresa.id, evento);

          

          // 2. Coleta o ID do evento para confirmar depois
              eventosParaConfirmar.push(evento.id);

          // 4. CONFIRMAÇÃO FINAL: Se houver eventos processados, avisa a UaiRango
         
            if (eventosParaConfirmar.length > 0) {
              // ✅ Passando os 3 argumentos: empresaId, config e a lista de IDs
              await uaiService.confirmarRecebimento(
                empresa.id, 
                empresa.configUaiRango as any, 
                eventosParaConfirmar
              );
            }
         
          const detalhes = await uaiService.getPedidoDetalhes(tenantId, evento.orderId, tokenBanco);       
          
          if (detalhes) {
            pedidosDetalhados.push(detalhes);
          }
        } catch (detailError: any) {
           throw detailError.message;
        }
    }

    // 4. Retorno dos dados enriquecidos
    return res.json({
      sucesso: true,
      recebidos: listaEventos.length,
      processados: pedidosDetalhados.length,
      pedidos: pedidosDetalhados 
    });

  } catch (error: any) {   
    return res.status(500).json({ error: error.message });
  }
}

 // Método isolado para confirmação
async confirmarProcessamentoPelaRota(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;
      const { eventIds } = req.body; // Espera um JSON: { "eventIds": ["id1", "id2"] }

      if (!eventIds || !Array.isArray(eventIds)) {
        return res.status(400).json({ error: "O campo eventIds deve ser um array." });
      }

      // 1. Busca a empresa para pegar as configurações
      const empresa = await prisma.empresa.findFirst({
        where: { tenant_id: tenantId }
      });

      if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

      // 2. Chama o service que faz o POST de confirmação na UaiRango
      await uaiService.confirmarRecebimento(empresa.id, empresa.configUaiRango as any, eventIds);

      return res.json({ sucesso: true, mensagem: `${eventIds.length} eventos confirmados.` });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }


 async getDetails(req: Request, res: Response) {
    try {
      const { id } = req.params; // ID do pedido
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
      const detalhes = await uaiService.getPedidoDetalhes(tenantId, id, tokenBanco);
      
      if (!detalhes) {
        return res.status(404).json({ error: "Pedido não encontrado na UaiRango ou token inválido." });
      }

      return res.json(detalhes);
    } catch (error: any) {   
      return res.status(400).json({ error: error.message });
    }
}
}