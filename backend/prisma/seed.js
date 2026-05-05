const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建种子数据...');

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const user = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      password: hashedPassword,
      nickname: '测试用户',
    },
  });

  console.log('创建测试用户:', user.username);

  // 创建积分账户并赠送积分
  const pointsAccount = await prisma.pointsAccount.upsert({
    where: { userId: user.id },
    update: { balance: 500 },
    create: {
      userId: user.id,
      balance: 500,
    },
  });

  console.log('创建积分账户，初始积分:', 500);

  // 获取今天和30天后的日期
  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  // 删除旧活动
  await prisma.activityPrize.deleteMany({});
  await prisma.activity.deleteMany({});

  // 创建大转盘活动
  const wheelActivity = await prisma.activity.create({
    data: {
      type: 'WHEEL',
      name: '幸运大转盘',
      description: '每日可参与3次，每次消耗10积分，超多奖品等你来拿！',
      startTime: today,
      endTime: thirtyDaysLater,
      pointsCost: 10,
      maxChances: 3,
      status: 'ACTIVE',
    },
  });

  // 创建大转盘奖品
  await prisma.activityPrize.createMany({
    data: [
      {
        activityId: wheelActivity.id,
        name: '100积分',
        description: '获得100积分奖励',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=golden%20coin%20stack%20with%20100%20written%20on%20it%20cartoon%20style&image_size=square',
        type: 'POINTS',
        pointsValue: 100,
        probability: 0.1,
        stock: 100,
        sortOrder: 0,
      },
      {
        activityId: wheelActivity.id,
        name: '50积分',
        description: '获得50积分奖励',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=golden%20coin%20stack%20with%2050%20written%20on%20it%20cartoon%20style&image_size=square',
        type: 'POINTS',
        pointsValue: 50,
        probability: 0.15,
        stock: 200,
        sortOrder: 1,
      },
      {
        activityId: wheelActivity.id,
        name: '20积分',
        description: '获得20积分奖励',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=golden%20coin%20stack%20with%2020%20written%20on%20it%20cartoon%20style&image_size=square',
        type: 'POINTS',
        pointsValue: 20,
        probability: 0.2,
        stock: 500,
        sortOrder: 2,
      },
      {
        activityId: wheelActivity.id,
        name: '优惠券',
        description: '获得5元优惠券',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=coupon%20ticket%20yellow%20color%20cartoon%20style&image_size=square',
        type: 'COUPON',
        probability: 0.1,
        stock: 50,
        sortOrder: 3,
      },
      {
        activityId: wheelActivity.id,
        name: '实物奖品',
        description: '获得精美小礼品',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gift%20box%20with%20bow%20cartoon%20style&image_size=square',
        type: 'PHYSICAL',
        probability: 0.05,
        stock: 20,
        sortOrder: 4,
      },
      {
        activityId: wheelActivity.id,
        name: '谢谢参与',
        description: '很遗憾，下次再来',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sad%20face%20emoji%20cartoon%20style&image_size=square',
        type: 'THANKYOU',
        probability: 0.4,
        stock: 99999,
        sortOrder: 5,
      },
    ],
  });

  console.log('创建大转盘活动:', wheelActivity.name);

  // 创建砸蛋活动
  const eggActivity = await prisma.activity.create({
    data: {
      type: 'EGG',
      name: '欢乐砸金蛋',
      description: '每日可参与5次，每次消耗5积分，砸出惊喜！',
      startTime: today,
      endTime: thirtyDaysLater,
      pointsCost: 5,
      maxChances: 5,
      status: 'ACTIVE',
    },
  });

  // 创建砸蛋奖品
  await prisma.activityPrize.createMany({
    data: [
      {
        activityId: eggActivity.id,
        name: '200积分',
        description: '获得200积分大奖',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=diamond%20treasure%20cartoon%20style&image_size=square',
        type: 'POINTS',
        pointsValue: 200,
        probability: 0.05,
        stock: 50,
        sortOrder: 0,
      },
      {
        activityId: eggActivity.id,
        name: '100积分',
        description: '获得100积分',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=golden%20coin%20stack%20cartoon%20style&image_size=square',
        type: 'POINTS',
        pointsValue: 100,
        probability: 0.15,
        stock: 100,
        sortOrder: 1,
      },
      {
        activityId: eggActivity.id,
        name: '50积分',
        description: '获得50积分',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=silver%20coin%20stack%20cartoon%20style&image_size=square',
        type: 'POINTS',
        pointsValue: 50,
        probability: 0.25,
        stock: 200,
        sortOrder: 2,
      },
      {
        activityId: eggActivity.id,
        name: '30积分',
        description: '获得30积分',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=copper%20coin%20stack%20cartoon%20style&image_size=square',
        type: 'POINTS',
        pointsValue: 30,
        probability: 0.3,
        stock: 500,
        sortOrder: 3,
      },
      {
        activityId: eggActivity.id,
        name: '谢谢参与',
        description: '很遗憾，下次再来',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sad%20face%20emoji%20cartoon%20style&image_size=square',
        type: 'THANKYOU',
        probability: 0.25,
        stock: 99999,
        sortOrder: 4,
      },
    ],
  });

  console.log('创建砸蛋活动:', eggActivity.name);
  console.log('========================================');
  console.log('种子数据创建完成！');
  console.log('测试账号: testuser / 123456');
  console.log('初始积分: 500');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
