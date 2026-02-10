export class Produto {
  constructor(
    public readonly id: string,
    public nome: string,
    public tenant_id: string,
    public externalId?: string,
    public externalCode?: string,
    public description?: string,
    public serving?: string,
    public weightQuantity?: number // Mapeamos o quantity aqui
  ) {}
}