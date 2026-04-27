import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  console.log('=== 检查数据库用户 ===');
  
  const users = await prisma.user.findMany();
  console.log('数据库中的用户数量:', users.length);
  
  for (const user of users) {
    console.log(`\n--- 用户: ${user.username} ---`);
    console.log('ID:', user.id);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Password hash (first 30 chars):', user.password.substring(0, 30) + '...');
    
    console.log('\n测试密码 123456:');
    const testPassword = '123456';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('bcrypt.compare 结果:', isMatch);
    
    if (!isMatch) {
      console.log('\n⚠️  密码不匹配！尝试重新生成哈希...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('新密码哈希:', newHash.substring(0, 30) + '...');
      
      console.log('更新数据库中的密码...');
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash }
      });
      console.log('✅ 密码已更新');
      
      const verifyMatch = await bcrypt.compare(testPassword, newHash);
      console.log('验证新密码:', verifyMatch);
    }
  }
  
  console.log('\n=== 检查完成 ===');
}

testLogin()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
