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

      // 2. Busca os eventos
      const eventos = await uaiService.buscarEventosPendentes(empresa.id, empresa.configUaiRango as any);

      // Importante: A API da UaiRango às vezes retorna um objeto com 'events' ou o array direto
      const listaEventos = Array.isArray(eventos) ? eventos : (eventos.events || []);

      if (listaEventos.length === 0) {
        return res.json({ mensagem: "Nenhum evento novo.", processados: 0 });
      }

      // 3. Processamento
      const eventIdsConfirmar: string[] = [];

      for (const evento of listaEventos) {
        try {
          // Passamos empresa.id para vincular corretamente no banco
          await uaiService.salvarPedidoNoBanco(empresa.id, empresa.id, evento);
          eventIdsConfirmar.push(evento.id);
        } catch (saveError: any) {
          console.error(`❌ Falha ao processar evento ${evento.id}:`, saveError.message);
        }
      }

      // 4. Acknowledge Automático
      if (eventIdsConfirmar.length > 0) {
        await uaiService.confirmarRecebimento(empresa.id, empresa.configUaiRango as any, eventIdsConfirmar);
      }

      return res.json({
        sucesso: true,
        recebidos: listaEventos.length,
        processados: eventIdsConfirmar.length,
        detalhes: "Eventos sincronizados e histórico gerado."
      });

    } catch (error: any) {
      console.error('🔥 Erro Crítico no Polling:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  async confirmEvents(req: Request, res: Response) {
    const { tenantId } = req.params;
    const { eventIds } = req.body;

    try {
      const empresa = await prisma.empresa.findFirst({
        where: { tenant_id: tenantId }
      });

      if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

      //await uaiService.confirmarRecebimento(empresa.id, empresa.configUaiRango as any, eventIds);

      return res.json({ sucesso: true, mensagem: 'Eventos confirmados.' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}