import { Empresa } from "../entities/Empresas";

export interface ITenantRepository {
  findById(id: string): Promise<Empresa | null>;
  findAllActive(): Promise<Empresa[]>; // Útil para o Polling
}