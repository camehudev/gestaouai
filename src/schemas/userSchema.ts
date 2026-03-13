import { z } from 'zod';

// Schema para Login
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.")
});

export const createUserSchema = z.object({
  name: z.string().min(6),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['USER', 'ADMIN']).optional()
}).strict(); // <-- O .strict() faz o Zod barrar qualquer campo não definido aqui