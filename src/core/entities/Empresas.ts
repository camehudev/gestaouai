// src/core/entities/Empresa.ts

export interface ConfigUaiRango {
  expires_at: any;
  access_token: any;
  client_id?: string;
  secret_key?: string;
}

export class Empresa {
  constructor(
    public readonly id: string,
    public nome: string,
    public cnpj: string,
    public tenant_id: string,
    public tokenUai?: string,       // 4º parâmetro
    public configUaiRango?: ConfigUaiRango, // 5º parâmetro (O que estava faltando)
    public readonly createdAt?: Date // 6º parâmetro (Opcional)
  ) {}
}