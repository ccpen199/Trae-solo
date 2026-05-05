import bcrypt from 'bcryptjs';
import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = 'Admin@123';
  
  console.log('原密码测试...');
  const existingHash = '$2a$10$uvHgXjsiUb45Sn1gDHnSt.3CtGq/s4wLxcgJrCNOfj.BWxneza8X6';
  const existingMatch = await bcrypt.compare(password, existingHash);
  console.log('原哈希匹配结果:', existingMatch);
  
  console.log('\n生成新哈希...');
  const newHash = await bcrypt.hash(password, 10);
  console.log('新哈希:', newHash);
  
  const newMatch = await bcrypt.compare(password, newHash);
  console.log('新哈希匹配结果:', newMatch);
  
  console.log('\n重置管理员密码...');
  
  const adminRole = await prisma.role.findUnique({
    where: { code: 'ADMIN' }
  });
  
  if (!adminRole) {
    console.error('未找到管理员角色');
    return;
  }
  
  const adminUser = await prisma.user.findFirst({
    where: { roleId: adminRole.id }
  });
  
  if (!adminUser) {
    console.error('未找到管理员用户');
    return;
  }
  
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { 
      passwordHash: newHash,
      email: 'admin@example.com',
      status: UserStatus.ACTIVE
    }
  });
  
  console.log('管理员密码已重置为: Admin@123');
  console.log('账号: admin');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
