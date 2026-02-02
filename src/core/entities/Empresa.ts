export class Empresa {
  constructor(
    public readonly id: string,
    public nome: string,
    public cnpj: string,
    public configUaiRango?: any
  ) {}
}