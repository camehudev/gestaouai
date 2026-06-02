export enum pedidoStatus {
  RECEIVED = 'RECEIVED',
  CONFIRMED = 'CONFIRMED',
  DISPATCHED = 'DISPATCHED',
  READY = 'READY',
  CANCELLED = 'CANCELLED'
}


export class Pedido {
  constructor(
    public readonly id: string,
    public readonly externalId: string,
    public readonly tenant_id: string, // Unificado com o padrão do banco
    public status: pedidoStatus,
    public valorTotal: number,
    public readonly createdAt: Date,
    public displayId?: string,         // Adicionado para o ID amigável da UaiRango
    public usuarioId?: string,
    public motivoCancelamentoId?: string // UUID para seguir o padrão
  ) {}

  // Regra de negócio: Garante integridade antes de chamar o banco
  podeSerCancelado(): boolean {
    const statusNaoCancelaveis = [pedidoStatus.DISPATCHED, pedidoStatus.CANCELLED];
    return !statusNaoCancelaveis.includes(this.status);
  }
}