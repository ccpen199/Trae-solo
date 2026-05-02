import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库种子数据...');

  console.log('创建用户...');

  const adminPassword = await hashPassword('admin123');
  const salesPassword = await hashPassword('sales123');
  const guidePassword = await hashPassword('guide123');
  const touristPassword = await hashPassword('tourist123');

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: '系统管理员',
      email: 'admin@tour.com',
      phone: '13800000001',
      role: 'ADMIN',
    },
  });

  const sales = await prisma.user.upsert({
    where: { username: 'sales' },
    update: {},
    create: {
      username: 'sales',
      password: salesPassword,
      name: '张销售',
      email: 'sales@tour.com',
      phone: '13800000002',
      role: 'SALES',
    },
  });

  const guide = await prisma.user.upsert({
    where: { username: 'guide' },
    update: {},
    create: {
      username: 'guide',
      password: guidePassword,
      name: '李导游',
      email: 'guide@tour.com',
      phone: '13800000003',
      role: 'GUIDE',
    },
  });

  const tourist = await prisma.user.upsert({
    where: { username: 'tourist' },
    update: {},
    create: {
      username: 'tourist',
      password: touristPassword,
      name: '王游客',
      email: 'tourist@tour.com',
      phone: '13800000004',
      role: 'TOURIST',
    },
  });

  console.log('用户创建完成:');
  console.log('  - 管理员: admin / admin123');
  console.log('  - 销售: sales / sales123');
  console.log('  - 导游: guide / guide123');
  console.log('  - 游客: tourist / tourist123');

  console.log('创建旅游线路...');

  const tour1 = await prisma.tour.upsert({
    where: { code: 'TOUR2024BJ001' },
    update: {},
    create: {
      code: 'TOUR2024BJ001',
      name: '北京故宫长城5日经典游',
      description: '深度游览北京名胜古迹，感受千年古都的魅力',
      destination: '北京',
      days: 5,
      nights: 4,
      routeDetails: 'D1:接机入住 - D2:故宫博物院 - D3:八达岭长城 - D4:颐和园 - D5:送机',
      includeItems: '4晚四星酒店住宿、景点门票、早餐、空调旅游大巴、优秀导游服务、旅行社责任险',
      excludeItems: '往返机票/高铁票、正餐（除早餐外）、个人消费、单房差',
      notes: '请提前7天报名，旺季需提前15天',
      category: '国内游',
      basePrice: 2980,
      childPrice: 1480,
      minGroupSize: 10,
      maxGroupSize: 30,
      status: 'PUBLISHED',
      creatorId: sales.id,
    },
  });

  const tour2 = await prisma.tour.upsert({
    where: { code: 'TOUR2024YN001' },
    update: {},
    create: {
      code: 'TOUR2024YN001',
      name: '云南大理丽江6日浪漫游',
      description: '风花雪月，苍山洱海，感受云南的浪漫风情',
      destination: '云南',
      days: 6,
      nights: 5,
      routeDetails: 'D1:昆明接机 - D2:大理古城 - D3:洱海游船 - D4:丽江古城 - D5:玉龙雪山 - D6:送机',
      includeItems: '5晚特色酒店、景点门票、早餐、空调旅游大巴、优秀导游服务、旅行社责任险',
      excludeItems: '往返机票、正餐（除早餐外）、个人消费、玉龙雪山索道费',
      notes: '高原地区请注意防晒和高反',
      category: '国内游',
      basePrice: 3580,
      childPrice: 1780,
      minGroupSize: 8,
      maxGroupSize: 25,
      status: 'PUBLISHED',
      creatorId: sales.id,
    },
  });

  const tour3 = await prisma.tour.upsert({
    where: { code: 'TOUR2024HN001' },
    update: {},
    create: {
      code: 'TOUR2024HN001',
      name: '海南三亚5日度假游',
      description: '阳光沙滩，椰林海风，享受热带海岛风情',
      destination: '海南',
      days: 5,
      nights: 4,
      routeDetails: 'D1:三亚接机 - D2:蜈支洲岛 - D3:南山文化苑 - D4:亚龙湾 - D5:送机',
      includeItems: '4晚海景酒店、景点门票、早餐、空调旅游大巴、优秀导游服务、旅行社责任险',
      excludeItems: '往返机票、正餐（除早餐外）、潜水等娱乐项目、个人消费',
      notes: '请自备防晒用品和泳装',
      category: '国内游',
      basePrice: 4280,
      childPrice: 1980,
      minGroupSize: 6,
      maxGroupSize: 20,
      status: 'PUBLISHED',
      creatorId: sales.id,
    },
  });

  console.log('旅游线路创建完成:');
  console.log('  - 北京故宫长城5日经典游');
  console.log('  - 云南大理丽江6日浪漫游');
  console.log('  - 海南三亚5日度假游');

  console.log('创建团期...');

  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const nextNextMonth = new Date(today);
  nextNextMonth.setMonth(nextNextMonth.getMonth() + 2);

  const group1Start = new Date(nextMonth);
  const group1End = new Date(group1Start);
  group1End.setDate(group1End.getDate() + 4);

  const group2Start = new Date(nextNextMonth);
  const group2End = new Date(group2Start);
  group2End.setDate(group2End.getDate() + 5);

  const group3Start = new Date(nextMonth);
  group3Start.setDate(group3Start.getDate() + 15);
  const group3End = new Date(group3Start);
  group3End.setDate(group3End.getDate() + 4);

  const group1 = await prisma.tourGroup.create({
    data: {
      tourId: tour1.id,
      code: 'GRP2024BJ001',
      startDate: group1Start,
      endDate: group1End,
      price: 2980,
      childPrice: 1480,
      totalStock: 30,
      soldStock: 8,
      minGroupSize: 10,
      maxGroupSize: 30,
      status: 'PUBLISHED',
      salesId: sales.id,
      guideId: guide.id,
      departurePoint: '北京首都机场T2航站楼',
      meetingTime: '早上8:00',
    },
  });

  const group2 = await prisma.tourGroup.create({
    data: {
      tourId: tour2.id,
      code: 'GRP2024YN001',
      startDate: group2Start,
      endDate: group2End,
      price: 3580,
      childPrice: 1780,
      totalStock: 25,
      soldStock: 0,
      minGroupSize: 8,
      maxGroupSize: 25,
      status: 'PUBLISHED',
      salesId: sales.id,
      guideId: guide.id,
      departurePoint: '昆明长水国际机场',
      meetingTime: '早上7:30',
    },
  });

  const group3 = await prisma.tourGroup.create({
    data: {
      tourId: tour3.id,
      code: 'GRP2024HN001',
      startDate: group3Start,
      endDate: group3End,
      price: 4280,
      childPrice: 1980,
      totalStock: 20,
      soldStock: 5,
      minGroupSize: 6,
      maxGroupSize: 20,
      status: 'PUBLISHED',
      salesId: sales.id,
      departurePoint: '三亚凤凰国际机场',
      meetingTime: '下午14:00',
    },
  });

  console.log('团期创建完成:');
  console.log(`  - GRP2024BJ001: ${group1Start.toLocaleDateString()} - ${group1End.toLocaleDateString()}`);
  console.log(`  - GRP2024YN001: ${group2Start.toLocaleDateString()} - ${group2End.toLocaleDateString()}`);
  console.log(`  - GRP2024HN001: ${group3Start.toLocaleDateString()} - ${group3End.toLocaleDateString()}`);

  console.log('创建行程详情...');

  for (let i = 1; i <= 5; i++) {
    const dayDetails = [
      { title: '接机入住', description: '根据航班时间接机，入住酒店后自由活动', breakfast: '自理', lunch: '自理', dinner: '自理', hotel: '北京四星酒店' },
      { title: '故宫博物院', description: '游览世界最大的宫殿建筑群，欣赏皇家珍宝', breakfast: '酒店自助', lunch: '团队餐', dinner: '自理', hotel: '北京四星酒店', attractions: '故宫博物院、景山公园' },
      { title: '八达岭长城', description: '攀登万里长城，感受不到长城非好汉的豪情', breakfast: '酒店自助', lunch: '团队餐', dinner: '自理', hotel: '北京四星酒店', attractions: '八达岭长城、明十三陵' },
      { title: '颐和园', description: '游览皇家园林，欣赏昆明湖美景', breakfast: '酒店自助', lunch: '团队餐', dinner: '自理', hotel: '北京四星酒店', attractions: '颐和园、圆明园遗址' },
      { title: '送机', description: '根据航班时间送机，结束愉快的北京之旅', breakfast: '酒店自助', lunch: '自理', dinner: '自理' },
    ];

    await prisma.itineraryDay.upsert({
      where: {
        groupId_dayNumber: {
          groupId: group1.id,
          dayNumber: i,
        },
      },
      update: {},
      create: {
        groupId: group1.id,
        dayNumber: i,
        ...dayDetails[i - 1],
      },
    });
  }

  console.log('行程详情创建完成');

  console.log('创建示例订单...');

  const order1 = await prisma.order.create({
    data: {
      orderNo: 'ORD202404280001',
      groupId: group1.id,
      touristId: tourist.id,
      contactName: '王游客',
      contactPhone: '13800000004',
      totalAmount: 5960,
      paidAmount: 5960,
      status: 'PAID',
      adultCount: 2,
      childCount: 0,
    },
  });

  await prisma.passenger.createMany({
    data: [
      {
        orderId: order1.id,
        name: '王游客',
        idType: '身份证',
        idNumber: '110101199001011234',
        phone: '13800000004',
        isChild: false,
        gender: '男',
      },
      {
        orderId: order1.id,
        name: '李女士',
        idType: '身份证',
        idNumber: '110101199002024321',
        phone: '13800000005',
        isChild: false,
        gender: '女',
      },
    ],
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      paymentNo: 'PAY202404280001',
      amount: 5960,
      method: 'ALIPAY',
      status: 'COMPLETED',
      paidAt: new Date(),
    },
  });

  console.log('示例订单创建完成');
  console.log('  - 订单号: ORD202404280001');
  console.log('  - 金额: 5960元 (2成人)');

  console.log('');
  console.log('========================================');
  console.log('数据库种子数据初始化完成!');
  console.log('========================================');
  console.log('');
  console.log('测试账号:');
  console.log('  - 管理员: admin / admin123');
  console.log('  - 销售: sales / sales123');
  console.log('  - 导游: guide / guide123');
  console.log('  - 游客: tourist / tourist123');
  console.log('');
  console.log('示例数据:');
  console.log('  - 3条旅游线路');
  console.log('  - 3个团期');
  console.log('  - 1个已支付订单');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
