import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

// Schema para Login (Seu original está bom, mantivemos)
export const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido." }),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.")
});

// Schema para Criação de Usuário Otimizado
export const createUserSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"), // Reduzi para 3, nomes curtos são comuns
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha muito curta"),
  role: z.enum(Role).optional().default(Role.USER), 
  status: z.preprocess((val) => {
   
    // Se não enviou nada, deixa o default do Zod agir enviando undefined
    if (!val) return undefined;
    
    // Se enviou string, higieniza para o formato do Banco (CAIXA ALTA)
    if (typeof val === 'string') return val.toUpperCase().trim();
    
    return val;
  }, 
  
    z.union([z.literal(UserStatus.ATIVO),
    z.literal(UserStatus.INATIVO), 
    z.literal(UserStatus.PENDENTE), 
    z.literal(UserStatus.BLOQUEADO)]))
    .default(UserStatus.PENDENTE) // Deixa o default do Zod agir enviando undefined 

}).strict();
