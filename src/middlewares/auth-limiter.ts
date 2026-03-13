import rateLimit from 'express-rate-limit';

// Criamos uma função geradora para podermos personalizar o limite por rota
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true, // Retorna os headers 'RateLimit-*'
    legacyHeaders: false, // Desabilita os headers 'X-RateLimit-*' antigos
  });
};

// Limiter específico para Login (mais restrito)
export const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  5, // Apenas 5 tentativas
  'Muitas tentativas de login. Tente novamente após 15 minutos.'
);

// Limiter para criação de contas (mais restrito ainda para evitar spam)
export const signUpLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hora
  3, // Apenas 3 contas por IP
  'Muitas tentativas de cadastro. Tente mais tarde.'
);