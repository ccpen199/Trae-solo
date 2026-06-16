import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CENTER_LAT = 39.9042;
const CENTER_LON = 116.4074;

function offsetCoord(lat: number, lon: number, latOffset: number, lonOffset: number) {
  return {
    lat: lat + (latOffset * 0.001),
    lon: lon + (lonOffset * 0.001),
  };
}

async function main() {
  console.log('🌱 开始种子数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { phone: '13800000000' },
    update: {},
    create: {
      phone: '13800000000',
      nickname: '系统管理员',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      latitude: CENTER_LAT,
      longitude: CENTER_LON,
      locationName: '北京市中心',
      interestTags: JSON.stringify(['社区管理', '政策关注']),
    },
  });

  const gov = await prisma.user.upsert({
    where: { phone: '13800000001' },
    update: {},
    create: {
      phone: '13800000001',
      nickname: '区政府办公室',
      passwordHash: hashedPassword,
      role: 'GOVERNMENT',
      isVerified: true,
      latitude: CENTER_LAT + 0.002,
      longitude: CENTER_LON + 0.002,
      locationName: '朝阳区政府',
      interestTags: JSON.stringify(['政务发布', '公共服务']),
    },
  });

  const citizenUsers = [];
  for (let i = 0; i < 10; i++) {
    const coord = offsetCoord(CENTER_LAT, CENTER_LON, Math.random() * 10 - 5, Math.random() * 10 - 5);
    const user = await prisma.user.upsert({
      where: { phone: `139000000${String(i).padStart(2, '0')}` },
      update: {},
      create: {
        phone: `139000000${String(i).padStart(2, '0')}`,
        nickname: `邻居小王${i + 1}`,
        passwordHash: hashedPassword,
        role: 'CITIZEN',
        isVerified: i < 3,
        latitude: coord.lat,
        longitude: coord.lon,
        locationName: `望京小区${i + 1}号楼`,
        interestTags: JSON.stringify([
          ['美食', '探店', '健身'],
          ['母婴', '亲子', '教育'],
          ['数码', '游戏', '科技'],
          ['旅游', '户外', '摄影'],
          ['理财', '房产', '汽车'],
        ][i % 5]),
      },
    });
    citizenUsers.push(user);
  }

  const merchantUser = await prisma.user.upsert({
    where: { phone: '13700000000' },
    update: {},
    create: {
      phone: '13700000000',
      nickname: '老王川菜',
      passwordHash: hashedPassword,
      role: 'MERCHANT',
      isVerified: true,
      latitude: CENTER_LAT + 0.003,
      longitude: CENTER_LON - 0.001,
      locationName: '望京SOHO',
      interestTags: JSON.stringify(['餐饮', '川菜']),
    },
  });

  const merchantCoord1 = offsetCoord(CENTER_LAT, CENTER_LON, 3, -1);
  const merchantCoord2 = offsetCoord(CENTER_LAT, CENTER_LON, -2, 2);
  const merchantCoord3 = offsetCoord(CENTER_LAT, CENTER_LON, 1, 4);

  const merchant1 = await prisma.merchant.upsert({
    where: { userId: merchantUser.id },
    update: {},
    create: {
      userId: merchantUser.id,
      businessName: '老王川菜馆',
      businessLicense: '91110000MA01ABCDE1',
      licenseVerified: true,
      category: '餐饮美食',
      address: '朝阳区望京街9号望京SOHO T1座',
      latitude: merchantCoord1.lat,
      longitude: merchantCoord1.lon,
      phone: '010-12345678',
      description: '正宗川菜，麻辣鲜香，20年老店。特色菜：水煮鱼、麻婆豆腐、回锅肉',
      rating: 4.7,
      reviewCount: 328,
      status: 'APPROVED',
    },
  });

  const merchant2User = await prisma.user.upsert({
    where: { phone: '13700000001' },
    update: {},
    create: {
      phone: '13700000001',
      nickname: '星爸爸咖啡店',
      passwordHash: hashedPassword,
      role: 'MERCHANT',
      isVerified: true,
    },
  });

  const merchant2 = await prisma.merchant.upsert({
    where: { userId: merchant2User.id },
    update: {},
    create: {
      userId: merchant2User.id,
      businessName: '星爸爸咖啡(望京店)',
      businessLicense: '91110000MA02ABCDE2',
      licenseVerified: true,
      category: '咖啡饮品',
      address: '朝阳区阜通东大街1号院',
      latitude: merchantCoord2.lat,
      longitude: merchantCoord2.lon,
      phone: '010-87654321',
      description: '全球连锁咖啡品牌，提供优质咖啡和舒适环境',
      rating: 4.5,
      reviewCount: 256,
      status: 'APPROVED',
    },
  });

  const merchant3User = await prisma.user.upsert({
    where: { phone: '13700000002' },
    update: {},
    create: {
      phone: '13700000002',
      nickname: '鲜果生活超市',
      passwordHash: hashedPassword,
      role: 'MERCHANT',
      isVerified: true,
    },
  });

  const merchant3 = await prisma.merchant.upsert({
    where: { userId: merchant3User.id },
    update: {},
    create: {
      userId: merchant3User.id,
      businessName: '鲜果生活超市',
      businessLicense: '91110000MA03ABCDE3',
      licenseVerified: true,
      category: '生鲜超市',
      address: '朝阳区望京西园一区',
      latitude: merchantCoord3.lat,
      longitude: merchantCoord3.lon,
      phone: '010-11112222',
      description: '新鲜蔬菜水果，每日直供，品质保证',
      rating: 4.3,
      reviewCount: 189,
      status: 'APPROVED',
    },
  });

  await prisma.coupon.deleteMany({});

  const coupon1 = await prisma.coupon.create({
    data: {
      merchantId: merchant1.id,
      title: '满200减30元代金券',
      description: '全场菜品通用，节假日通用，不与其他优惠同享',
      discountType: 'FIXED_AMOUNT',
      discountValue: 30,
      minSpend: 200,
      totalQuantity: 200,
      claimedQuantity: 45,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const coupon2 = await prisma.coupon.create({
    data: {
      merchantId: merchant1.id,
      title: '招牌水煮鱼8折券',
      description: '仅限招牌水煮鱼一份使用',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minSpend: 88,
      totalQuantity: 100,
      claimedQuantity: 23,
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  const coupon3 = await prisma.coupon.create({
    data: {
      merchantId: merchant2.id,
      title: '买一送一券',
      description: '购买任意手工饮品，赠送同款中杯饮品一杯',
      discountType: 'BUY_X_GET_Y',
      discountValue: 1,
      minSpend: 30,
      totalQuantity: 500,
      claimedQuantity: 128,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const coupon4 = await prisma.coupon.create({
    data: {
      merchantId: merchant3.id,
      title: '满100减15超市券',
      description: '水果专区满100元立减15元',
      discountType: 'FIXED_AMOUNT',
      discountValue: 15,
      minSpend: 100,
      totalQuantity: 300,
      claimedQuantity: 89,
      startDate: new Date(),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
  });

  const topicNames = [
    { name: '#望京美食探店', isHot: true, category: '美食', heatScore: 9500 },
    { name: '#今日望京新鲜事', isHot: true, category: '资讯', heatScore: 8800 },
    { name: '#邻里互助', isHot: true, category: '社区', heatScore: 7600 },
    { name: '#闲置物品转让', isHot: false, category: '社区', heatScore: 5400 },
    { name: '#望京学区房讨论', isHot: true, category: '房产', heatScore: 6800 },
    { name: '#周边核酸检测', isHot: false, category: '便民', heatScore: 4200 },
    { name: '#停水停电通知', isHot: false, category: '便民', heatScore: 3800 },
    { name: '#公交地铁出行', isHot: false, category: '便民', heatScore: 3500 },
    { name: '#周末亲子活动', isHot: true, category: '亲子', heatScore: 6200 },
    { name: '#健身打卡', isHot: false, category: '运动', heatScore: 2800 },
  ];

  for (const t of topicNames) {
    await prisma.topic.upsert({
      where: { name: t.name },
      update: { isHot: t.isHot, heatScore: t.heatScore },
      create: t,
    });
  }

  const samplePosts = [
    {
      userId: gov.id,
      type: 'NOTICE',
      sourceLevel: 'GOV',
      title: '【官方发布】2024年朝阳区义务教育阶段入学政策解读',
      content: '各位居民朋友：现将2024年我区义务教育阶段入学工作的有关事项通知如下：\n1. 入学年龄：2018年8月31日前出生的适龄儿童\n2. 信息采集时间：5月1日-5月31日\n3. 材料审核时间：6月中旬\n请各位家长及时准备相关材料，如有疑问可拨打区教委咨询电话：010-8888xxxx',
      status: 'APPROVED',
      topics: ['#今日望京新鲜事'],
      likeCount: 234,
      commentCount: 89,
      viewCount: 5600,
      shareCount: 156,
    },
    {
      userId: gov.id,
      type: 'NOTICE',
      sourceLevel: 'GOV',
      title: '【紧急】关于明日朝阳区部分区域计划停电的通知',
      content: '因电网改造施工，以下区域将于明日（6月16日）8:00-18:00暂停供电：\n\n涉及区域：\n- 望京西园一区1-5号楼\n- 望京SOHO T2座\n- 阜通东大街沿线\n\n请相关居民提前做好准备，给您带来的不便敬请谅解。',
      status: 'APPROVED',
      topics: ['#停水停电通知', '#今日望京新鲜事'],
      likeCount: 567,
      commentCount: 123,
      viewCount: 12000,
      shareCount: 489,
      expireAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: citizenUsers[0].id,
      type: 'REVIEW',
      title: '【真实探店】老王川菜馆，这道菜千万别点！',
      content: '今天中午和同事去了望京SOHO的老王川菜馆，总体还可以，但有个避坑提醒：\n\n✅ 推荐：水煮鱼（真的很嫩，麻辣适中）\n✅ 推荐：麻婆豆腐（下饭神器，18元性价比高）\n⚠️ 避坑：鱼香肉丝（太甜了，个人不喜欢）\n\n💰人均消费：75元/人（有图有小票，见图片）\n📍 坐标：望京SOHO T1座\n\n对了！在平台领了满200减30的券，3个人花了210，减完180，划算！',
      latitude: merchantCoord1.lat,
      longitude: merchantCoord1.lon,
      locationName: '望京SOHO T1座',
      merchantId: merchant1.id,
      priceAnchor: 75,
      hasProof: true,
      isPitfall: true,
      status: 'APPROVED',
      topics: ['#望京美食探店'],
      images: JSON.stringify(['https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400']),
      likeCount: 89,
      commentCount: 34,
      viewCount: 1200,
      shareCount: 12,
    },
    {
      userId: citizenUsers[1].id,
      type: 'REVIEW',
      title: '星爸爸新品测评！冰镇桂花拿铁YYDS',
      content: '夏天到了，星爸爸又出新品了！\n\n☕ 冰镇桂花拿铁（中杯38元）\n甜度：⭐⭐⭐\n咖啡浓度：⭐⭐⭐⭐\n桂花香气：⭐⭐⭐⭐⭐\n\n第一口真的惊艳！桂花的清香和咖啡的醇厚完美融合，不甜腻，冰块量刚好。38元略贵，但用买一送一券就很香了～',
      latitude: merchantCoord2.lat,
      longitude: merchantCoord2.lon,
      locationName: '星爸爸咖啡(望京店)',
      merchantId: merchant2.id,
      priceAnchor: 38,
      hasProof: true,
      status: 'APPROVED',
      topics: ['#望京美食探店'],
      images: JSON.stringify(['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400']),
      likeCount: 56,
      commentCount: 18,
      viewCount: 890,
      shareCount: 8,
    },
    {
      userId: citizenUsers[2].id,
      type: 'NEWS',
      title: '突发！望京地铁站出口扶梯故障，请注意绕行',
      content: '刚刚经过望京地铁站C口，发现上行扶梯突然停了，有工作人员正在维修。\n\n有大件行李的朋友建议走B口或者D口，A口人太多了。\n\n已经恢复了吗？评论区更新一下～',
      latitude: offsetCoord(CENTER_LAT, CENTER_LON, 0, 0).lat,
      longitude: offsetCoord(CENTER_LAT, CENTER_LON, 0, 0).lon,
      locationName: '望京地铁站',
      status: 'APPROVED',
      topics: ['#今日望京新鲜事', '#公交地铁出行'],
      likeCount: 234,
      commentCount: 67,
      viewCount: 3400,
      shareCount: 89,
    },
    {
      userId: citizenUsers[3].id,
      type: 'ACTIVITY',
      title: '周末去哪儿？望京公园亲子露营活动报名！',
      content: '🏕️ 望京邻里亲子露营会\n📅 时间：6月17日（周六）9:00-16:00\n📍 地点：望京公园中央草坪\n\n活动内容：\n- 亲子手作DIY\n- 共享野餐（每家带一道菜）\n- 儿童飞盘游戏\n- 绘本交换角\n\n报名方式：评论区留言「参加+人数」\n人数限制：30个家庭，先到先得！',
      latitude: offsetCoord(CENTER_LAT, CENTER_LON, 2, 1).lat,
      longitude: offsetCoord(CENTER_LAT, CENTER_LON, 2, 1).lon,
      locationName: '望京公园',
      status: 'APPROVED',
      topics: ['#周末亲子活动', '#今日望京新鲜事'],
      likeCount: 178,
      commentCount: 145,
      viewCount: 2300,
      shareCount: 67,
    },
    {
      userId: citizenUsers[4].id,
      type: 'INFO',
      title: '望京周边核酸检测点最新汇总（6月更新）',
      content: '整理了望京附近的核酸检测点，需要的小伙伴收藏一下：\n\n1️⃣ 望京社区卫生服务中心\n⏰ 时间：8:00-11:30, 13:30-17:00\n💰 费用：16元\n📍 距离：约800米\n\n2️⃣ 和睦家医院\n⏰ 时间：24小时\n💰 费用：60元（加急120元）\n📍 距离：约1.2公里\n\n3️⃣ 万科时代广场检测点\n⏰ 时间：9:00-18:00\n💰 费用：16元\n📍 距离：约1.5公里\n\n有变动的话评论区补充哦～',
      status: 'APPROVED',
      topics: ['#周边核酸检测', '#便民服务'],
      likeCount: 445,
      commentCount: 78,
      viewCount: 8900,
      shareCount: 234,
    },
    {
      userId: citizenUsers[5].id,
      type: 'NEWS',
      title: '辟谣！网传"望京出现确诊"不实信息，请不信谣不传谣',
      content: '今天下午在多个群里看到有人说望京某小区出现确诊，经核实为不实信息！\n\n⚠️ 请大家以官方发布为准，不要转发未经证实的消息\n\n造谣者已经被平台处理，账号封禁。谣言止于智者！',
      status: 'APPROVED',
      topics: ['#今日望京新鲜事'],
      likeCount: 890,
      commentCount: 234,
      viewCount: 15600,
      shareCount: 567,
    },
  ];

  for (const p of samplePosts) {
    const { topics, ...postData } = p as any;
    await prisma.post.create({
      data: {
        ...postData,
        topics: {
          create: topics.map((topicName: string) => ({
            topic: {
              connectOrCreate: {
                where: { name: topicName },
                create: { name: topicName },
              },
            },
          })),
        },
      },
    });
  }

  const helpRequests = [
    {
      userId: citizenUsers[6].id,
      type: 'SECOND_HAND',
      title: '9成新儿童自行车转让',
      content: '孩子长大了骑不了了，16寸儿童自行车，蓝色，9成新，原价599，现150出。\n\n自提地址：望京西园三区，可小刀。\n\n有兴趣的私信，先到先得！',
      latitude: offsetCoord(CENTER_LAT, CENTER_LON, 4, 2).lat,
      longitude: offsetCoord(CENTER_LAT, CENTER_LON, 4, 2).lon,
      locationName: '望京西园三区北门',
      urgency: 1,
    },
    {
      userId: citizenUsers[7].id,
      type: 'SKILL_EXCHANGE',
      title: '英语家教换钢琴课/游泳课',
      content: '本人英语专业八级，有5年家教经验，可辅导小学/初中英语。\n\n想换：\n- 儿童钢琴课（孩子6岁，零基础）\n- 或者成人游泳课（我本人）\n\n时间周末都可以，感兴趣的私聊～',
      latitude: offsetCoord(CENTER_LAT, CENTER_LON, -1, 3).lat,
      longitude: offsetCoord(CENTER_LAT, CENTER_LON, -1, 3).lon,
      locationName: '望京花园东区',
      urgency: 1,
    },
    {
      userId: citizenUsers[8].id,
      type: 'EMERGENCY',
      title: '【紧急求助】老人走丢，请帮忙留意！',
      content: '紧急！我奶奶今天下午2点左右从望京西园二区家里出来就没回来，有轻微阿尔茨海默症。\n\n特征：\n- 78岁，身高约155cm\n- 穿浅灰色上衣，黑色裤子\n- 手里拿着一个布袋子\n\n已经报警了！如果有邻居看到，请马上联系我：13900000008\n\n万分感谢！！！',
      latitude: offsetCoord(CENTER_LAT, CENTER_LON, 1, -2).lat,
      longitude: offsetCoord(CENTER_LAT, CENTER_LON, 1, -2).lon,
      locationName: '望京西园二区',
      radiusMeters: 3000,
      urgency: 3,
    },
    {
      userId: citizenUsers[9].id,
      type: 'OTHER',
      title: '出差一周，求帮忙喂猫，可付费',
      content: '下周一到周五出差，家里一只英短蓝猫，性格温顺。\n\n需要帮忙：每天晚上来喂一次猫粮+换水+清理猫砂\n\n地址：望京SOHO附近\n报酬：50元/天，或者回来请吃饭\n\n有邻居方便的话私信我～',
      latitude: offsetCoord(CENTER_LAT, CENTER_LON, 3, 0).lat,
      longitude: offsetCoord(CENTER_LAT, CENTER_LON, 3, 0).lon,
      locationName: '望京SOHO公寓',
      urgency: 2,
    },
  ];

  for (const h of helpRequests) {
    await prisma.helpRequest.create({ data: h as any });
  }

  await prisma.utilityService.deleteMany({});

  const busService = await prisma.utilityService.create({
    data: {
      type: 'BUS',
      name: '望京公交实时到站',
      provider: '北京公交集团',
      data: JSON.stringify({
        stations: [
          {
            id: 'bus_001',
            name: '望京地铁站',
            lat: CENTER_LAT,
            lon: CENTER_LON,
            lines: [
              { name: '404路', direction: '东直门外' },
              { name: '416路', direction: '来广营西桥东' },
              { name: '682路', direction: '城铁望京西站' },
              { name: '991路', direction: '青年路口' },
            ],
          },
          {
            id: 'bus_002',
            name: '望京SOHO',
            lat: merchantCoord1.lat,
            lon: merchantCoord1.lon,
            lines: [
              { name: '467路', direction: '静安庄' },
              { name: '536路', direction: '左家庄' },
              { name: '快速直达专线194路', direction: '丰台体育中心' },
            ],
          },
          {
            id: 'bus_003',
            name: '望京西园',
            lat: offsetCoord(CENTER_LAT, CENTER_LON, 4, 2).lat,
            lon: offsetCoord(CENTER_LAT, CENTER_LON, 4, 2).lon,
            lines: [
              { name: '404路', direction: '东直门外' },
              { name: '416路', direction: '来广营西桥东' },
              { name: '944路', direction: '菜户营桥西' },
            ],
          },
          {
            id: 'bus_004',
            name: '阜通东大街',
            lat: merchantCoord2.lat,
            lon: merchantCoord2.lon,
            lines: [
              { name: '445路', direction: '南十里居' },
              { name: '854路', direction: '狼各庄' },
              { name: '快速直达专线19路', direction: '大北窑北' },
            ],
          },
          {
            id: 'bus_005',
            name: '望京公园',
            lat: offsetCoord(CENTER_LAT, CENTER_LON, 2, 1).lat,
            lon: offsetCoord(CENTER_LAT, CENTER_LON, 2, 1).lon,
            lines: [
              { name: '621路', direction: '半截塔村' },
              { name: '991路', direction: '青年路口' },
            ],
          },
        ],
      }),
    },
  });

  const covidTestService = await prisma.utilityService.create({
    data: {
      type: 'COVID_TEST',
      name: '周边核酸检测点',
      provider: '朝阳区卫健委',
      data: JSON.stringify({
        sites: [
          {
            id: 'test_001',
            name: '望京社区卫生服务中心',
            address: '朝阳区望京街18号',
            lat: offsetCoord(CENTER_LAT, CENTER_LON, 0.8, 0.5).lat,
            lon: offsetCoord(CENTER_LAT, CENTER_LON, 0.8, 0.5).lon,
            hours: '8:00-11:30, 13:30-17:00',
            price: 16,
            status: '开放中',
            waitTime: '约15分钟',
          },
          {
            id: 'test_002',
            name: '和睦家医院',
            address: '朝阳区将台路2号',
            lat: offsetCoord(CENTER_LAT, CENTER_LON, -1, 2).lat,
            lon: offsetCoord(CENTER_LAT, CENTER_LON, -1, 2).lon,
            hours: '24小时',
            price: 60,
            status: '开放中',
            waitTime: '约30分钟',
          },
          {
            id: 'test_003',
            name: '万科时代广场检测点',
            address: '朝阳区望京西路8号',
            lat: offsetCoord(CENTER_LAT, CENTER_LON, 1.5, -1.5).lat,
            lon: offsetCoord(CENTER_LAT, CENTER_LON, 1.5, -1.5).lon,
            hours: '9:00-18:00',
            price: 16,
            status: '开放中',
            waitTime: '约10分钟',
          },
          {
            id: 'test_004',
            name: '北京惠兰医院',
            address: '朝阳区望京北路18号',
            lat: offsetCoord(CENTER_LAT, CENTER_LON, 3, -1).lat,
            lon: offsetCoord(CENTER_LAT, CENTER_LON, 3, -1).lon,
            hours: '8:00-20:00',
            price: 35,
            status: '开放中',
            waitTime: '约20分钟',
          },
          {
            id: 'test_005',
            name: '国宗济世中医院',
            address: '朝阳区南湖南路15号',
            lat: offsetCoord(CENTER_LAT, CENTER_LON, -2, 0.5).lat,
            lon: offsetCoord(CENTER_LAT, CENTER_LON, -2, 0.5).lon,
            hours: '8:30-17:30',
            price: 16,
            status: '开放中',
            waitTime: '约15分钟',
          },
        ],
      }),
    },
  });

  const waterNotice = await prisma.utilityService.create({
    data: {
      type: 'WATER_NOTICE',
      name: '停水通知',
      provider: '北京市自来水集团',
      data: JSON.stringify({}),
    },
  });

  const powerNotice = await prisma.utilityService.create({
    data: {
      type: 'POWER_NOTICE',
      name: '停电通知',
      provider: '国家电网北京电力',
      data: JSON.stringify({}),
    },
  });

  await prisma.utilityUpdate.createMany({
    data: [
      {
        serviceId: powerNotice.id,
        title: '6月16日望京西园部分区域计划停电',
        content: '因电网改造施工，望京西园一区1-5号楼、望京SOHO T2座、阜通东大街沿线将于6月16日8:00-18:00暂停供电。',
        locationScope: '望京西园一区、望京SOHO周边',
        startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
        severity: 3,
      },
      {
        serviceId: waterNotice.id,
        title: '6月18日望京东路水管检修停水',
        content: '因自来水管网检修，望京东路沿线（阜通东大街至广泽路段）将于6月18日9:00-16:00暂停供水。',
        locationScope: '望京东路沿线',
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
        severity: 2,
      },
      {
        serviceId: powerNotice.id,
        title: '6月20日来广营区域设备维护',
        content: '电力设备例行维护，来广营西路部分区域将于6月20日0:00-6:00短时停电。',
        locationScope: '来广营西路',
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        severity: 1,
      },
    ],
  });

  console.log('✅ 种子数据完成！');
  console.log('');
  console.log('📋 测试账号：');
  console.log('   管理员: 13800000000 / 123456');
  console.log('   政府账号: 13800000001 / 123456');
  console.log('   商户账号: 13700000000 / 123456');
  console.log('   市民用户: 13900000000 ~ 13900000009 / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
