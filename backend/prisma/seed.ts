import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 角色常量
const Role = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  EMPLOYEE: 'EMPLOYEE',
} as const;

async function main() {
  console.log('🌱 开始种子数据...');

  // 检查是否已有管理员
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (existingAdmin) {
    console.log('✅ 管理员已存在，跳过种子数据');
    return;
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 创建默认管理员
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      name: '系统管理员',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ 创建管理员成功:', admin.username);

  // 创建一个主管示例
  const supervisorPassword = await bcrypt.hash('123456', 10);
  const supervisor = await prisma.user.create({
    data: {
      username: 'supervisor',
      email: 'supervisor@example.com',
      password: supervisorPassword,
      name: '张主管',
      role: Role.SUPERVISOR,
      isActive: true,
    },
  });

  console.log('✅ 创建主管成功:', supervisor.username);

  // 创建员工示例
  const employeePassword = await bcrypt.hash('123456', 10);
  const employee1 = await prisma.user.create({
    data: {
      username: 'employee1',
      email: 'employee1@example.com',
      password: employeePassword,
      name: '李员工',
      role: Role.EMPLOYEE,
      isActive: true,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      username: 'employee2',
      email: 'employee2@example.com',
      password: employeePassword,
      name: '王员工',
      role: Role.EMPLOYEE,
      isActive: true,
    },
  });

  console.log('✅ 创建员工成功:', employee1.username, employee2.username);

  console.log('\n========================================');
  console.log('种子数据创建完成!');
  console.log('========================================');
  console.log('管理员账号: admin / admin123');
  console.log('主管账号: supervisor / 123456');
  console.log('员工账号: employee1 / 123456');
  console.log('员工账号: employee2 / 123456');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('种子数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
