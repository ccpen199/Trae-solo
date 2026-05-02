import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

const demoUsers = [
  {
    username: 'landlord',
    email: 'landlord@example.com',
    password: 'password123',
    phone: '13800138001',
    role: 'LANDLORD',
    realName: '张房东',
  },
  {
    username: 'guest',
    email: 'guest@example.com',
    password: 'password123',
    phone: '13800138002',
    role: 'GUEST',
    realName: '李住客',
  },
  {
    username: 'cleaner',
    email: 'cleaner@example.com',
    password: 'password123',
    phone: '13800138003',
    role: 'CLEANER',
    realName: '王保洁',
  },
  {
    username: 'channel',
    email: 'channel@example.com',
    password: 'password123',
    phone: '13800138004',
    role: 'CHANNEL_PLATFORM',
    realName: '渠道平台',
  },
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'password123',
    phone: '13800138005',
    role: 'ADMIN',
    realName: '管理员',
  },
];

async function seed() {
  console.log('开始创建演示账号...');

  for (const user of demoUsers) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: user.email }, { username: user.username }],
      },
    });

    if (existingUser) {
      console.log(`用户已存在: ${user.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password, 12);

    await prisma.user.create({
      data: {
        username: user.username,
        email: user.email,
        password: hashedPassword,
        phone: user.phone,
        role: user.role,
        realName: user.realName,
        isActive: true,
        isVerified: true,
      },
    });

    console.log(`创建用户: ${user.email} (${user.role})`);
  }

  console.log('演示账号创建完成！');
  console.log('');
  console.log('可用账号:');
  console.log('  房东: landlord@example.com / password123');
  console.log('  住客: guest@example.com / password123');
  console.log('  保洁: cleaner@example.com / password123');
  console.log('  渠道: channel@example.com / password123');
  console.log('  管理员: admin@example.com / password123');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
