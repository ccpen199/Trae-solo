import { PrismaClient, UserRole, DistributionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建种子数据...');

  const passwordHash = await bcrypt.hash('123456', 10);

  console.log('创建管理员...');
  const admin = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      phone: '13800138000',
      passwordHash,
      nickname: '系统管理员',
      role: UserRole.ADMIN,
      distributorId: 'ADMIN001',
      referralCode: 'ADMIN001',
      joinDate: new Date(),
      distributorStatus: DistributionStatus.ACTIVE,
      department: '技术部',
    },
  });

  console.log('创建财务人员...');
  const finance = await prisma.user.upsert({
    where: { phone: '13800138001' },
    update: {},
    create: {
      phone: '13800138001',
      passwordHash,
      nickname: '财务小张',
      role: UserRole.FINANCE,
      distributorId: 'FIN001',
      referralCode: 'FIN001',
      joinDate: new Date(),
      distributorStatus: DistributionStatus.ACTIVE,
      department: '财务部',
    },
  });

  console.log('创建运营人员...');
  const operator = await prisma.user.upsert({
    where: { phone: '13800138002' },
    update: {},
    create: {
      phone: '13800138002',
      passwordHash,
      nickname: '运营小李',
      role: UserRole.OPERATOR,
      distributorId: 'OP001',
      referralCode: 'OP001',
      joinDate: new Date(),
      distributorStatus: DistributionStatus.ACTIVE,
      department: '运营部',
    },
  });

  console.log('创建分销员A...');
  const distributorA = await prisma.user.upsert({
    where: { phone: '13900139001' },
    update: {},
    create: {
      phone: '13900139001',
      passwordHash,
      nickname: '分销员小王',
      role: UserRole.DISTRIBUTOR,
      distributorId: 'DISTA001',
      referralCode: 'DISTA001',
      joinDate: new Date(),
      distributorStatus: DistributionStatus.ACTIVE,
    },
  });

  console.log('创建分销员B...');
  const distributorB = await prisma.user.upsert({
    where: { phone: '13900139002' },
    update: {},
    create: {
      phone: '13900139002',
      passwordHash,
      nickname: '分销员小陈',
      role: UserRole.DISTRIBUTOR,
      distributorId: 'DISTB001',
      referralCode: 'DISTB001',
      joinDate: new Date(),
      distributorStatus: DistributionStatus.ACTIVE,
    },
  });

  console.log('创建分销关系...');
  await prisma.distributionRelation.upsert({
    where: { parentId_childId: { parentId: distributorA.id, childId: distributorB.id } },
    update: {},
    create: {
      parentId: distributorA.id,
      childId: distributorB.id,
      level: 1,
      status: DistributionStatus.ACTIVE,
      joinTime: new Date(),
    },
  });

  console.log('创建普通用户...');
  const endUser = await prisma.user.upsert({
    where: { phone: '13700137001' },
    update: {},
    create: {
      phone: '13700137001',
      passwordHash,
      nickname: '普通用户张三',
      role: UserRole.END_USER,
    },
  });

  console.log('创建虚拟账户...');
  const users = [admin, finance, operator, distributorA, distributorB, endUser];
  for (const user of users) {
    await prisma.virtualAccount.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        totalBalance: 0,
        frozenBalance: 0,
        availableBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
      },
    });
  }

  console.log('创建示例商品...');
  const products = [
    {
      name: '高端护肤套装',
      description: '包含洁面、水、乳、精华四件套',
      price: 29900,
      costPrice: 9900,
      sku: 'SKU001',
      stock: 1000,
      commissionRate: 0.15,
      levelRates: { 1: 0.15, 2: 0.08, 3: 0.04 },
    },
    {
      name: '智能手表 Pro',
      description: '多功能智能手表，支持心率监测、运动追踪',
      price: 129900,
      costPrice: 59900,
      sku: 'SKU002',
      stock: 500,
      commissionRate: 0.12,
      levelRates: { 1: 0.12, 2: 0.06, 3: 0.03 },
    },
    {
      name: '精品茶叶礼盒',
      description: '精选高山龙井，精美礼盒包装',
      price: 39900,
      costPrice: 15900,
      sku: 'SKU003',
      stock: 2000,
      commissionRate: 0.20,
      levelRates: { 1: 0.20, 2: 0.10, 3: 0.05 },
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log('创建推广素材...');
  const materials = [
    {
      name: '护肤套装海报',
      type: 'IMAGE',
      content: 'https://example.com/images/skincare-poster.jpg',
      thumbnail: 'https://example.com/images/skincare-thumb.jpg',
      status: 'active',
    },
    {
      name: '智能手表宣传视频',
      type: 'VIDEO',
      content: 'https://example.com/videos/watch.mp4',
      thumbnail: 'https://example.com/videos/watch-thumb.jpg',
      status: 'active',
    },
    {
      name: '茶叶礼盒分享链接',
      type: 'LINK',
      content: '/products/tea-gift',
      status: 'active',
    },
  ];

  for (const material of materials) {
    await prisma.promotionMaterial.upsert({
      where: { id: material.name },
      update: {},
      create: material,
    });
  }

  console.log('=========================================');
  console.log('种子数据创建完成！');
  console.log('');
  console.log('测试账号：');
  console.log('  管理员: 13800138000 / 123456');
  console.log('  财务:   13800138001 / 123456');
  console.log('  运营:   13800138002 / 123456');
  console.log('  分销员A: 13900139001 / 123456 (推荐码: DISTA001)');
  console.log('  分销员B: 13900139002 / 123456 (推荐码: DISTB001)');
  console.log('  普通用户: 13700137001 / 123456');
  console.log('');
  console.log('分销关系: 分销员A -> 分销员B');
  console.log('=========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
