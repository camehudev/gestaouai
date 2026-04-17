import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Cria um novo usuário com senha criptografada
   */
  async create(userData: any) {
    const { name, email, password, empresaId, role } = userData;

    // 1. Verificar se o e-mail já existe (Regra Global)
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new Error('Este e-mail já está cadastrado no sistema.');
    }

    // 2. Criptografar a senha (Salt de 10 rounds é o padrão seguro)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Criar o registro no banco vinculado à Empresa
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        empresaId, // O vínculo com o seu Tenant
        role: role || 'USER',
      },
    });

    // 4. Retornar os dados exceto a senha
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Busca todos os usuários de uma empresa específica (Isolamento de dados)
   */
  async listByEmpresa(empresaId: string) {
    return prisma.user.findMany({
      where: { empresaId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }


  /**
   * Busca um usuário específico dentro de uma empresa
   */
  async findByIdAndEmpresa(id: string, empresaId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id,
        empresaId // Filtro crucial para multi-tenancy
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return user;
  }

  /**
   * Deleta um usuário garantindo que ele pertença à empresa informada
   */
  async delete(id: string, empresaId: string) {
    // Primeiro verificamos se o usuário existe e pertence à empresa
    const user = await this.findByIdAndEmpresa(id, empresaId);

    if (!user) {
      throw new Error('Usuário não encontrado ou não pertence a esta empresa.');
    }

    return prisma.user.delete({
      where: { id }
    });
  }
}