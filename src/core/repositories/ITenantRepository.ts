import { Empresa } from "../entities/Empresa";

export interface ITenantRepository {
  findById(id: string): Promise<Empresa | null>;
  findAllActive(): Promise<Empresa[]>; // Útil para o Polling
}