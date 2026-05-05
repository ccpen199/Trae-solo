import { PrismaClient, RoleCode, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export async function initializeDatabase() {
  const adminRole = await prisma.role.upsert({
    where: { code: RoleCode.ADMIN },
    update: {},
    create: {
      code: RoleCode.ADMIN,
      name: '管理员',
      description: '系统管理员，拥有最高权限',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { code: RoleCode.USER },
    update: {},
    create: {
      code: RoleCode.USER,
      name: '普通用户',
      description: '普通注册用户',
    },
  });

  const adminExists = await prisma.user.findFirst({
    where: { roleId: adminRole.id },
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
      data: {
        account: 'admin',
        passwordHash,
        nickname: '系统管理员',
        email: 'admin@example.com',
        status: UserStatus.ACTIVE,
        roleId: adminRole.id,
      },
    });
    console.log('默认管理员账号已创建: admin / Admin@123');
  }

  return { adminRole, userRole };
}

export { prisma };
