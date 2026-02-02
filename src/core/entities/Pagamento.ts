export class Pagamento {
  constructor(
    public readonly id: string,
    public readonly pedidoId: string,
    public tipo: 'CARD' | 'CASH',
    public bandeiraCartao?: string,
    public valorTroco?: number,
    public cupomCodigo?: string,
    public cupomValor?: number
  ) {}
}