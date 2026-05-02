import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      role: 'ADMIN',
      balance: 99999,
    },
  });

  const customerService = await prisma.user.upsert({
    where: { username: 'customer_service' },
    update: {},
    create: {
      username: 'customer_service',
      password: hashedPassword,
      email: 'cs@example.com',
      role: 'CUSTOMER_SERVICE',
      balance: 0,
    },
  });

  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      password: hashedPassword,
      email: 'testuser@example.com',
      role: 'USER',
      balance: 10000,
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { username: 'seller' },
    update: {},
    create: {
      username: 'seller',
      password: hashedPassword,
      email: 'seller@example.com',
      role: 'USER',
      balance: 5000,
    },
  });

  const existingAccounts = await prisma.gameAccount.count({ where: { sellerId: sellerUser.id } });
  if (existingAccounts === 0) {
    const accounts = [
      {
        title: '原神 50级成品号 五星多',
        description: '夜兰、胡桃、钟离，多个强力五星角色，冒险等级50级',
        gameName: '原神',
        gameServer: '官服',
        accountLevel: 50,
        price: 1500,
        originalPrice: 2000,
        status: 'APPROVED',
        isTop: true,
        isHot: true,
        sellerId: sellerUser.id,
      },
      {
        title: '王者荣耀 V8 全英雄账号',
        description: '贵族8，全英雄，皮肤200+，稀有皮肤多',
        gameName: '王者荣耀',
        gameServer: 'QQ区',
        accountLevel: 30,
        price: 3500,
        originalPrice: 5000,
        status: 'APPROVED',
        isTop: false,
        isHot: true,
        sellerId: sellerUser.id,
      },
      {
        title: '和平精英 战神段位账号',
        description: 'SS18赛季无敌战神，KD5.0，多套时装枪械皮肤',
        gameName: '和平精英',
        gameServer: '微信区',
        accountLevel: 80,
        price: 2200,
        originalPrice: 2800,
        status: 'APPROVED',
        isTop: true,
        isHot: false,
        sellerId: sellerUser.id,
      },
      {
        title: '崩坏：星穹铁道 40级账号',
        description: '开拓等级40，景元、银狼、罗刹，五星角色多',
        gameName: '崩坏：星穹铁道',
        gameServer: '官服',
        accountLevel: 40,
        price: 800,
        originalPrice: 1200,
        status: 'APPROVED',
        isTop: false,
        isHot: false,
        sellerId: sellerUser.id,
      },
      {
        title: '英雄联盟 全英雄账号',
        description: '艾欧尼亚大区，全英雄，皮肤150+，钻石段位',
        gameName: '英雄联盟',
        gameServer: '艾欧尼亚',
        accountLevel: 300,
        price: 1800,
        originalPrice: 2500,
        status: 'PENDING_REVIEW',
        isTop: false,
        isHot: false,
        sellerId: sellerUser.id,
      },
    ];

    await prisma.gameAccount.createMany({ data: accounts });
  }

  const existingExceptions = await prisma.exception.count();
  if (existingExceptions === 0) {
    const exceptions = [
      {
        type: 'PAYMENT_ISSUE',
        title: '用户支付超时',
        description: '订单支付超过30分钟未确认',
        status: 'PENDING',
        priority: 'HIGH',
        handlerId: customerService.id,
      },
      {
        type: 'ACCOUNT_ISSUE',
        title: '账号密码错误',
        description: '买家投诉账号密码不正确，无法登录',
        status: 'PROCESSING',
        priority: 'URGENT',
        handlerId: customerService.id,
      },
      {
        type: 'COMPLAINT',
        title: '账号描述不符',
        description: '实际账号与描述的五星角色数量不符',
        status: 'PENDING',
        priority: 'MEDIUM',
        handlerId: customerService.id,
      },
      {
        type: 'REFUND_REQUEST',
        title: '申请退款',
        description: '买家未登录，申请全额退款',
        status: 'PROCESSING',
        priority: 'HIGH',
        handlerId: customerService.id,
      },
    ];

    await prisma.exception.createMany({ data: exceptions });
  }

  const existingTodos = await prisma.todo.count();
  if (existingTodos === 0) {
    const todos = [
      {
        title: '审核新上架账号',
        description: '英雄联盟账号待审核',
        type: 'ACCOUNT_REVIEW',
        status: 'PENDING',
        priority: 'HIGH',
        assigneeId: customerService.id,
      },
      {
        title: '跟进异常订单',
        description: '账号密码错误问题需要处理',
        type: 'EXCEPTION_HANDLE',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        assigneeId: customerService.id,
      },
      {
        title: '联系买家确认收货',
        description: '订单已发货，等待买家确认',
        type: 'CUSTOMER_FOLLOWUP',
        status: 'PENDING',
        priority: 'MEDIUM',
        assigneeId: customerService.id,
      },
    ];

    await prisma.todo.createMany({ data: todos });
  }

  console.log('Seed data created successfully');
  console.log('Admin user:', admin.username, 'password: 123456');
  console.log('Customer Service user:', customerService.username, 'password: 123456');
  console.log('Test user:', testUser.username, 'password: 123456');
  console.log('Seller user:', sellerUser.username, 'password: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
