export class Usuario {
  constructor(
    public readonly id: string,
    public nome: string,
    public email: string,
    public readonly tenant_id: string, // Movido para antes dos opcionais
    public senha?: string,             // Opcional
    public readonly createdAt?: Date   // Opcional
  ) {}

  // Exemplo de Regra de Negócio: Validar e-mail
  validarEmail(): boolean {
    const regex = /\S+@\S+\.\S+/;
    return regex.test(this.email);
  }

  // Regra de Negócio: Ocultar dados sensíveis
  exporDadosPublicos() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      tenant_id: this.tenant_id
    };
  }
}