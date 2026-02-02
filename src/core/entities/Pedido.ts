export enum PedidoStatus {
  RECEIVED = 'RECEIVED',
  CONFIRMED = 'CONFIRMED',
  DISPATCHED = 'DISPATCHED',
  READY = 'READY',
  CANCELLED = 'CANCELLED'
}

export class Pedido {
  constructor(
    public readonly id: string,
    public readonly externalId: string, // ID da UAI Rango
    public readonly tenantId: string,
    public status: PedidoStatus,
    public valorTotal: number,
    public readonly createdAt: Date,
    public usuarioId?: string,
    public motivoCancelamentoId?: number
  ) {}

  // Exemplo de regra de negócio na entidade
  podeSerCancelado(): boolean {
    return this.status !== PedidoStatus.DISPATCHED && this.status !== PedidoStatus.CANCELLED;
  }
}