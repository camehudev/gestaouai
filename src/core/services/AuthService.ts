import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';

export class AuthService {
  async login(email: string, password: string) {
    // 1. Buscar o usuário pelo e-mail
    const user = await prisma.user.findUnique({
      where: { email },
      include: { empresa: true } // Opcional: traz os dados da empresa junto
    });

    if (!user) {
      throw new Error('E-mail ou senha incorretos.');
    }

    // 2. Verificar se a senha é válida
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('E-mail ou senha incorretos.');
    }

    // 3. Gerar o Token JWT
    // Payload: o que queremos "esconder" dentro do token
    const token = jwt.sign(
      {          
        name: user.name,
        //empresaId: user.empresaId, 
        //ole: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '1d' } // Token vale por 1 dia
    );

    // 4. Retornar os dados necessários para o Front-end
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        empresaId: user.empresaId,
        role: user.role
      },
      token
    };
  }
}