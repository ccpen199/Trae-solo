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
  console.log('🔧 开始增强种子数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // ============================================
  // 1. 补充更多商户（覆盖更多分类）
  // ============================================
  console.log('📦 检查商户数据...');

  const merchantCount = await prisma.merchant.count();
  console.log(`   现有商户: ${merchantCount} 家`);

  if (merchantCount < 6) {
    const additionalMerchants = [
      {
        phone: '13700000010',
        nickname: '潮流造型',
        businessName: '潮流造型(望京旗舰店)',
        category: '美容美发',
        license: '91110000MA10ABCDE8',
        coord: offsetCoord(CENTER_LAT, CENTER_LON, -1, -2),
        address: '朝阳区望京街10号合生麒麟社',
        description: '高端美发沙龙，资深造型师团队，提供剪烫染护全方位服务',
        rating: 4.6,
        reviewCount: 168,
        coupons: [
          { title: '新人洗剪吹5折券', type: 'PERCENTAGE', value: 50, minSpend: 68, total: 100, claimed: 35 },
          { title: '烫染满300减80', type: 'FIXED_AMOUNT', value: 80, minSpend: 300, total: 50, claimed: 18 },
        ],
      },
      {
        phone: '13700000011',
        nickname: '乐玩游戏厅',
        businessName: '乐玩电玩城',
        category: '休闲娱乐',
        license: '91110000MA11ABCDE9',
        coord: offsetCoord(CENTER_LAT, CENTER_LON, 2, -3),
        address: '朝阳区望京西路48号金隅国际',
        description: '大型电玩娱乐中心，娃娃机、赛车、跳舞机、投篮机应有尽有',
        rating: 4.4,
        reviewCount: 245,
        coupons: [
          { title: '100枚游戏币特惠', type: 'FIXED_AMOUNT', value: 20, minSpend: 80, total: 200, claimed: 78 },
        ],
      },
      {
        phone: '13700000012',
        nickname: '快修侠',
        businessName: '快修侠手机电脑维修',
        category: '生活服务',
        license: '91110000MA12ABCDEF',
        coord: offsetCoord(CENTER_LAT, CENTER_LON, -3, 1),
        address: '朝阳区阜通西大街21号',
        description: '专业手机电脑维修，上门服务，30分钟快速响应',
        rating: 4.8,
        reviewCount: 98,
        coupons: [
          { title: '首次维修立减30', type: 'FIXED_AMOUNT', value: 30, minSpend: 99, total: 300, claimed: 120 },
        ],
      },
    ];

    for (const m of additionalMerchants) {
      const user = await prisma.user.upsert({
        where: { phone: m.phone },
        update: {},
        create: {
          phone: m.phone,
          nickname: m.nickname,
          passwordHash: hashedPassword,
          role: 'MERCHANT',
          isVerified: true,
          latitude: m.coord.lat,
          longitude: m.coord.lon,
          locationName: m.address,
          interestTags: JSON.stringify([m.category]),
        },
      });

      const existing = await prisma.merchant.findFirst({ where: { userId: user.id } });
      if (!existing) {
        const merchant = await prisma.merchant.create({
          data: {
            userId: user.id,
            businessName: m.businessName,
            businessLicense: m.license,
            licenseVerified: true,
            category: m.category,
            address: m.address,
            latitude: m.coord.lat,
            longitude: m.coord.lon,
            phone: '010-' + Math.floor(10000000 + Math.random() * 89999999),
            description: m.description,
            rating: m.rating,
            reviewCount: m.reviewCount,
            status: 'APPROVED',
            images: JSON.stringify([
              `https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400`,
              `https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400`,
            ]),
          },
        });

        for (const c of m.coupons) {
          await prisma.coupon.create({
            data: {
              merchantId: merchant.id,
              title: c.title,
              description: '到店出示即可使用，不与其他优惠同享',
              discountType: c.type,
              discountValue: c.value,
              minSpend: c.minSpend,
              totalQuantity: c.total,
              claimedQuantity: c.claimed,
              isActive: true,
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }

        console.log(`   新增商户: ${m.businessName}`);
      }
    }
  }

  // ============================================
  // 2. 给没有坐标的帖子补充坐标
  // ============================================
  console.log('📍 修复帖子坐标...');
  const postsWithoutCoords = await prisma.post.findMany({
    where: { latitude: null },
    select: { id: true, title: true },
  });
  console.log(`   无坐标帖子: ${postsWithoutCoords.length} 篇`);

  if (postsWithoutCoords.length > 0) {
    let i = 0;
    for (const p of postsWithoutCoords) {
      const coord = offsetCoord(CENTER_LAT, CENTER_LON, (i % 7) - 3, (i % 5) - 2);
      await prisma.post.update({
        where: { id: p.id },
        data: {
          latitude: coord.lat,
          longitude: coord.lon,
          locationName: `望京${['SOHO', '西园', '东园', '公园', '地铁站', '商业街', '科技园'][i % 7]}`,
        },
      });
      i++;
    }
    console.log(`   已修复 ${postsWithoutCoords.length} 篇帖子坐标`);
  }

  // ============================================
  // 3. 更新话题 postCount
  // ============================================
  console.log('🏷️  更新话题 postCount...');
  const allTopics = await prisma.topic.findMany();
  let updatedTopics = 0;

  for (const topic of allTopics) {
    const count = await prisma.postTopic.count({ where: { topicId: topic.id } });
    if (count !== topic.postCount) {
      await prisma.topic.update({
        where: { id: topic.id },
        data: { postCount: count },
      });
      updatedTopics++;
    }
  }
  console.log(`   更新了 ${updatedTopics} 个话题的帖子计数`);

  // ============================================
  // 4. 补充更多帖子（覆盖更多类型和信源等级）
  // ============================================
  console.log('📝 补充更多帖子...');

  const postCount = await prisma.post.count();
  console.log(`   现有帖子: ${postCount} 篇`);

  if (postCount < 20) {
    const govUser = await prisma.user.findFirst({ where: { role: 'GOVERNMENT' } });
    const citizenUsers = await prisma.user.findMany({
      where: { role: 'CITIZEN' },
      take: 8,
      orderBy: { createdAt: 'asc' },
    });
    const merchant1 = await prisma.merchant.findFirst({ where: { category: '餐饮美食' } });
    const merchant2 = await prisma.merchant.findFirst({ where: { category: '咖啡饮品' } });
    const merchant3 = await prisma.merchant.findFirst({ where: { category: '美容美发' } });

    const morePosts = [
      // 政务通知类
      {
        userId: govUser?.id || citizenUsers[0].id,
        type: 'NOTICE',
        sourceLevel: 'GOV',
        title: '【官方】2024年朝阳区社区居委会换届选举公告',
        content: '各位居民：根据《中华人民共和国城市居民委员会组织法》规定，我区将于近期开展社区居委会换届选举工作。\n\n选举时间：2024年7月15日\n选举地点：各社区活动中心\n\n请符合条件的居民携带身份证前往投票。',
        topics: ['#今日望京新鲜事'],
        likeCount: 156,
        commentCount: 45,
        viewCount: 4200,
        shareCount: 78,
        coord: offsetCoord(CENTER_LAT, CENTER_LON, 0.5, 0.5),
      },
      {
        userId: govUser?.id || citizenUsers[0].id,
        type: 'EMERGENCY',
        sourceLevel: 'GOV',
        title: '【紧急预警】今夜有大到暴雨，请做好防范准备',
        content: '市气象局发布暴雨蓝色预警：预计今夜至明天白天，我市将出现大到暴雨，局地大暴雨。\n\n防范提示：\n1. 减少外出，注意交通安全\n2. 关好门窗，收好阳台物品\n3. 低洼地区居民注意防范内涝\n4. 遇紧急情况拨打110/119/120',
        topics: ['#今日望京新鲜事', '#停水停电通知'],
        likeCount: 489,
        commentCount: 156,
        viewCount: 9800,
        shareCount: 324,
        coord: offsetCoord(CENTER_LAT, CENTER_LON, 0, 0),
      },
      // 探店类
      {
        userId: citizenUsers[3]?.id || citizenUsers[0].id,
        type: 'REVIEW',
        title: '打卡望京新开的网红咖啡店，环境绝了！',
        content: '周末和闺蜜去了这家新开的咖啡店，环境真的太棒了！\n\n☕ 点了：\n- 生椰拿铁 ¥32 （推荐！椰香浓郁）\n- 手冲耶加雪菲 ¥48 （微酸回甘）\n- 提拉米苏 ¥36 （口感绵密）\n\n环境是工业风+绿植，拍照很出片！人均60左右，适合约会或者办公。',
        topics: ['#望京美食探店'],
        merchantId: merchant2?.id,
        priceAnchor: 60,
        hasProof: true,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
          'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=500',
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500',
        ]),
        likeCount: 167,
        commentCount: 45,
        viewCount: 2300,
        shareCount: 28,
        coord: offsetCoord(CENTER_LAT, CENTER_LON, -2, 2),
      },
      {
        userId: citizenUsers[4]?.id || citizenUsers[0].id,
        type: 'REVIEW',
        title: '避雷！这家理发店办卡后服务态度大变',
        content: '上周在楼下理发店办了张500的卡，当时服务特别好。\n\n今天再去，洗头的小伙子全程玩手机，剪发的理发师也心不在焉的，剪出来的效果跟上次差远了。\n\n⚠️ 避坑提醒：\n1. 不要轻易办卡！尤其是新店\n2. 办卡前问清楚能不能退\n3. 保留好消费凭证\n\n想知道是哪家的私信我，避免更多人踩坑！',
        topics: ['#望京美食探店', '#避坑指南'],
        isPitfall: true,
        priceAnchor: 500,
        hasProof: false,
        likeCount: 234,
        commentCount: 178,
        viewCount: 5600,
        shareCount: 89,
        coord: offsetCoord(CENTER_LAT, CENTER_LON, -1, -2),
      },
      // 本地资讯类
      {
        userId: citizenUsers[5]?.id || citizenUsers[0].id,
        type: 'NEWS',
        sourceLevel: 'V',
        title: '望京地铁14号线将延长运营时间至23:30',
        content: '好消息！从下月起，地铁14号线将延长运营时间。\n\n📅 实施时间：7月1日起\n⏰ 末班车时间：23:30（原22:50）\n🚇 涉及站点：14号线全线\n\n对我们夜归族来说真的太友好了！再也不用担心赶不上末班车了～',
        topics: ['#今日望京新鲜事', '#公交地铁出行'],
        likeCount: 345,
        commentCount: 98,
        viewCount: 6700,
        shareCount: 156,
        coord: offsetCoord(CENTER_LAT, CENTER_LON, 0.5, 0),
      },
      // 商圈活动类
      {
        userId: citizenUsers[6]?.id || citizenUsers[0].id,
        type: 'ACTIVITY',
        title: '合生麒麟社年中庆！全场餐饮5折起',
        content: '🎉 合生麒麟社年中庆来啦！\n\n活动时间：6月18日-6月25日\n\n✅ 餐饮：全场5折起\n✅ 零售：满300减100\n✅ 电影：19.9元特惠票\n✅ 免费停车：消费满100免2小时\n\n周末约起来！',
        topics: ['#今日望京新鲜事', '#周末亲子活动'],
        likeCount: 267,
        commentCount: 89,
        viewCount: 4500,
        shareCount: 123,
        coord: offsetCoord(CENTER_LAT, CENTER_LON, -1.5, -2.5),
      },
      // 便民信息类
      {
        userId: citizenUsers[7]?.id || citizenUsers[0].id,
        type: 'INFO',
        title: '望京社区医院三伏贴预约开始啦！',
        content: '冬病夏治正当时！望京社区医院2024年三伏贴预约开始了～\n\n📅 预约时间：即日起至7月10日\n💰 费用：每贴30元，共9贴\n🏥 地点：望京社区卫生服务中心中医科\n👨‍⚕️ 适宜人群：慢性支气管炎、哮喘、鼻炎、体寒怕冷等\n\n需要的邻居们别错过哦！',
        topics: ['#周边核酸检测', '#便民服务'],
        likeCount: 156,
        commentCount: 45,
        viewCount: 3200,
        shareCount: 67,
        coord: offsetCoord(CENTER_LAT, CENTER_LON, 1.5, 1),
      },
      {
        userId: citizenUsers[1]?.id || citizenUsers[0].id,
        type: 'REVIEW',
        title: '鲜果生活超市水果测评，哪款最划算？',
        content: '作为一个水果控，几乎每周都去鲜果生活超市买水果。今天来测评几款常买的～\n\n🍓 草莓：29.9/盒 （推荐！很新鲜）\n🍒 车厘子：59.9/斤 （偏贵但品质好）\n🍌 香蕉：5.99/斤 （一般，有时候有黑斑）\n🍇 阳光玫瑰：29.9/斤 （必买！超甜）\n\n整体来说品质不错，就是价格略高。用平台的满100减15券会划算些。',
        topics: ['#望京美食探店'],
        merchantId: merchant3?.id,
        priceAnchor: 80,
        hasProof: true,
        isPitfall: false,
        likeCount: 112,
        commentCount: 34,
        viewCount: 1800,
        shareCount: 15,
        coord: offsetCoord(CENTER_LAT, CENTER_LON, 1, 4),
      },
    ];

    for (const p of morePosts) {
      const { topics, coord, merchantId, priceAnchor, hasProof, isPitfall, images, ...postData }: any = p;
      await prisma.post.create({
        data: {
          ...postData,
          latitude: coord?.lat,
          longitude: coord?.lon,
          locationName: `望京${Math.floor(Math.random() * 5) + 1}号`,
          merchantId: merchantId || undefined,
          priceAnchor: priceAnchor || undefined,
          hasProof: hasProof || false,
          isPitfall: isPitfall || false,
          images: images || JSON.stringify([]),
          status: 'APPROVED',
          topics: {
            create: (topics || []).map((topicName: string) => ({
              topic: {
                connectOrCreate: {
                  where: { name: topicName },
                  create: { name: topicName, isHot: false, heatScore: 100 },
                },
              },
            })),
          },
        },
      });
    }

    console.log(`   新增 ${morePosts.length} 篇帖子`);

    // 再次更新话题计数
    const topicsAfter = await prisma.topic.findMany();
    for (const topic of topicsAfter) {
      const count = await prisma.postTopic.count({ where: { topicId: topic.id } });
      await prisma.topic.update({
        where: { id: topic.id },
        data: { postCount: count, heatScore: count * 50 + Math.floor(Math.random() * 500) },
      });
    }
  }

  // ============================================
  // 5. 补充更多互动（点赞、评论）
  // ============================================
  console.log('💬 补充评论数据...');
  const approvedPosts = await prisma.post.findMany({
    where: { status: 'APPROVED' },
    take: 10,
    orderBy: { likeCount: 'desc' },
  });

  const commentCount = await prisma.comment.count();
  if (commentCount < 20) {
    const sampleComments = [
      '说得太对了！',
      '感谢分享，收藏了',
      '我也有同感',
      '请问具体在哪里呀？',
      '周末去试试',
      '已收藏，下次打卡',
      '这个必须赞！',
      '楼主说得好详细',
      '性价比怎么样？',
      '人多吗？需要排队吗？',
    ];

    const commentCitizens = await prisma.user.findMany({ where: { role: 'CITIZEN' }, take: 8 });
    let added = 0;
    for (const post of approvedPosts.slice(0, 5)) {
      const randomUser = commentCitizens[Math.floor(Math.random() * commentCitizens.length)];
      if (randomUser) {
        for (let i = 0; i < 3; i++) {
          await prisma.comment.create({
            data: {
              postId: post.id,
              userId: randomUser.id,
              content: sampleComments[Math.floor(Math.random() * sampleComments.length)],
            },
          });
          added++;
        }
      }
    }
    console.log(`   新增 ${added} 条评论`);
  }

  console.log('');
  console.log('✅ 数据增强完成！');
  console.log('');
  console.log('📊 数据统计：');
  console.log(`   用户数: ${await prisma.user.count()}`);
  console.log(`   商户数: ${await prisma.merchant.count()}`);
  console.log(`   帖子数: ${await prisma.post.count({ where: { status: 'APPROVED' } })}`);
  console.log(`   话题数: ${await prisma.topic.count()}`);
  console.log(`   优惠券数: ${await prisma.coupon.count()}`);
  console.log(`   互助请求数: ${await prisma.helpRequest.count()}`);
  console.log(`   评论数: ${await prisma.comment.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
