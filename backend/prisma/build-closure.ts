import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔗 构建业务闭环数据...');
  console.log();

  const govUser = await prisma.user.findFirst({ where: { role: 'GOVERNMENT' } });
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const citizenUsers = await prisma.user.findMany({ where: { role: 'CITIZEN' }, take: 10 });
  const defaultAuditor = adminUser || govUser || citizenUsers[0];

  // 1. 补充政务通知 (GOV 信源)
  console.log('📢 补充政务通知(GOV信源)...');
  const govPostsData = [
    {
      title: '【官方通知】2024年望京街道社区居委会选举公告',
      content: '各位居民：根据《中华人民共和国城市居民委员会组织法》规定，经街道办事处研究决定，望京街道各社区居委会换届选举工作将于7月正式启动。请符合条件的居民积极参与选民登记。',
      type: 'NOTICE',
      sourceLevel: 'GOV',
      sourceOrg: '望京街道办事处',
      topics: ['#政务通知'],
    },
    {
      title: '【政务发布】朝阳区2024年义务教育入学政策解读',
      content: '2024年朝阳区义务教育入学政策已正式发布。今年继续实行多校划片政策，新增3所小学和2所中学。望京片区入学顺位保持不变，请家长们及时关注相关信息。',
      type: 'NOTICE',
      sourceLevel: 'GOV',
      sourceOrg: '朝阳区教育委员会',
      topics: ['#望京学区房讨论', '#政务通知'],
    },
  ];

  for (const postData of govPostsData) {
    const existing = await prisma.post.findFirst({ where: { title: postData.title } });
    if (!existing) {
      const created = await prisma.post.create({
        data: {
          title: postData.title,
          content: postData.content,
          type: postData.type,
          sourceLevel: postData.sourceLevel,
          sourceOrg: postData.sourceOrg,
          status: 'APPROVED',
          userId: govUser?.id || defaultAuditor?.id,
          latitude: 39.995 + Math.random() * 0.01,
          longitude: 116.47 + Math.random() * 0.01,
          locationName: '望京街道办事处',
          viewCount: Math.floor(Math.random() * 5000) + 2000,
          likeCount: Math.floor(Math.random() * 200) + 50,
          commentCount: Math.floor(Math.random() * 30) + 5,
          shareCount: Math.floor(Math.random() * 50) + 10,
          hotScore: 0,
        },
      });

      for (const topicName of postData.topics) {
        const topic = await prisma.topic.upsert({
          where: { name: topicName },
          update: { postCount: { increment: 1 } },
          create: { name: topicName, category: '资讯', postCount: 1, isHot: false, heatScore: 0 },
        });
        await prisma.postTopic.create({
          data: { postId: created.id, topicId: topic.id },
        });
      }

      if (defaultAuditor) {
        await prisma.auditLog.create({
          data: {
            postId: created.id,
            auditorId: defaultAuditor.id,
            action: 'APPROVE',
            riskLevel: 'LOW',
            aiScore: 0,
            reason: '政务官方账号发布，自动通过审核',
          },
        });
      }

      console.log(`   ✅ 新增: ${postData.title.substring(0, 30)}...`);
    }
  }

  // 2. 补充官方/突发事件
  console.log('📰 补充官方认证资讯与突发事件...');
  const officialPostsData = [
    {
      title: '【突发】望京地铁站早高峰临时限流，请错峰出行',
      content: '今日早高峰期间，望京地铁站14号线因设备检修，站厅采取临时限流措施。预计持续时间约1小时，请乘客提前规划出行路线，或选择其他交通方式。',
      type: 'EMERGENCY',
      sourceLevel: 'OFFICIAL',
      sourceOrg: '北京地铁运营公司',
      riskLevel: 'MEDIUM',
      aiScore: 65,
      aiReason: '包含突发事件关键词，建议人工复核',
      humanAction: 'APPROVE',
      humanReason: '信息属实，标记为官方突发',
      topics: ['#今日望京新鲜事', '#突发提醒'],
    },
    {
      title: '【商圈活动】凯德MALL望京店年中庆盛大启幕',
      content: '凯德MALL望京店2024年中庆正式启幕！全场品牌低至3折，餐饮满200减100，更有幸运大抽奖。活动时间：6月15日-6月30日。',
      type: 'ACTIVITY',
      sourceLevel: 'V',
      sourceOrg: '凯德MALL官方',
      riskLevel: 'LOW',
      aiScore: 15,
      aiReason: '正常活动推广内容',
      humanAction: 'APPROVE',
      humanReason: 'V认证商家，通过审核',
      topics: ['#商圈活动', '#今日望京新鲜事'],
    },
  ];

  for (const postData of officialPostsData) {
    const existing = await prisma.post.findFirst({ where: { title: postData.title } });
    if (!existing) {
      const created = await prisma.post.create({
        data: {
          title: postData.title,
          content: postData.content,
          type: postData.type,
          sourceLevel: postData.sourceLevel,
          sourceOrg: postData.sourceOrg,
          status: 'APPROVED',
          userId: citizenUsers[1]?.id || citizenUsers[0]?.id,
          latitude: 39.995 + Math.random() * 0.01,
          longitude: 116.47 + Math.random() * 0.01,
          locationName: '望京商圈',
          viewCount: Math.floor(Math.random() * 3000) + 500,
          likeCount: Math.floor(Math.random() * 150) + 20,
          commentCount: Math.floor(Math.random() * 50) + 5,
          shareCount: Math.floor(Math.random() * 80) + 10,
          hotScore: 0,
        },
      });

      for (const topicName of postData.topics) {
        const topic = await prisma.topic.upsert({
          where: { name: topicName },
          update: { postCount: { increment: 1 } },
          create: { name: topicName, category: '资讯', postCount: 1, isHot: true, heatScore: 100 },
        });
        await prisma.postTopic.create({
          data: { postId: created.id, topicId: topic.id },
        });
      }

      if (defaultAuditor) {
        await prisma.auditLog.create({
          data: {
            postId: created.id,
            auditorId: defaultAuditor.id,
            action: (postData as any).humanAction || 'APPROVE',
            riskLevel: (postData as any).riskLevel || 'LOW',
            aiScore: (postData as any).aiScore || 0,
            reason: (postData as any).humanReason || '审核通过',
            matchedKeywords: (postData as any).aiReason || '',
          },
        });
      }

      console.log(`   ✅ 新增: ${postData.title.substring(0, 30)}...`);
    }
  }

  // 3. 补充探店笔记（带价格锚点、凭证、避坑）
  console.log('🍜 补充探店笔记（价格锚点/凭证/避坑）...');
  const reviewPostsData = [
    {
      title: '探店｜望京这家潮汕牛肉火锅真的绝了！附详细点单攻略',
      content: '今天和朋友去了望京SOHO的这家潮汕牛肉火锅，真的太好吃了！牛肉特别新鲜，手打牛肉丸Q弹有嚼劲。强烈推荐吊龙和匙柄！',
      type: 'REVIEW',
      sourceLevel: 'ORDINARY',
      priceAnchor: 120,
      hasProof: true,
      isPitfall: false,
      topics: ['#望京美食探店', '#美食分享'],
    },
    {
      title: '避坑提醒！望京某网红咖啡店名不副实',
      content: '被小红书种草的这家网红咖啡店，专程打车过去打卡，结果大失所望。环境一般，咖啡出品很普通，一杯拿铁要48块，性价比极低。',
      type: 'REVIEW',
      sourceLevel: 'ORDINARY',
      priceAnchor: 48,
      hasProof: true,
      isPitfall: true,
      topics: ['#望京美食探店', '#避坑指南'],
    },
  ];

  for (const postData of reviewPostsData) {
    const existing = await prisma.post.findFirst({ where: { title: postData.title } });
    let created;
    if (existing) {
      created = await prisma.post.update({
        where: { id: existing.id },
        data: {
          sourceLevel: postData.sourceLevel,
          priceAnchor: (postData as any).priceAnchor || null,
          hasProof: (postData as any).hasProof || false,
          isPitfall: (postData as any).isPitfall || false,
          status: 'APPROVED',
        },
      });
      await prisma.auditLog.deleteMany({ where: { postId: existing.id } });
    } else {
      const randomUser = citizenUsers[Math.floor(Math.random() * citizenUsers.length)];
      created = await prisma.post.create({
        data: {
          title: postData.title,
          content: postData.content,
          type: postData.type,
          sourceLevel: postData.sourceLevel,
          priceAnchor: (postData as any).priceAnchor || null,
          hasProof: (postData as any).hasProof || false,
          isPitfall: (postData as any).isPitfall || false,
          status: 'APPROVED',
          userId: randomUser?.id,
          latitude: 39.995 + Math.random() * 0.01,
          longitude: 116.47 + Math.random() * 0.01,
          locationName: '望京SOHO',
          viewCount: Math.floor(Math.random() * 2000) + 100,
          likeCount: Math.floor(Math.random() * 100) + 10,
          commentCount: Math.floor(Math.random() * 30) + 3,
          shareCount: Math.floor(Math.random() * 20) + 2,
          hotScore: 0,
        },
      });
    }

    if (!existing) {
      for (const topicName of postData.topics) {
        const topic = await prisma.topic.upsert({
          where: { name: topicName },
          update: { postCount: { increment: 1 } },
          create: { name: topicName, category: '生活', postCount: 1, isHot: false, heatScore: 50 },
        });
        await prisma.postTopic.create({
          data: { postId: created.id, topicId: topic.id },
        });
      }

      // 评论
      const comments = ['收藏了，周末去试试！', '真的假的？', '感谢分享，避坑了', '人均还可以接受', '这家我也去过'];
      for (let i = 0; i < 3; i++) {
        const commentUser = citizenUsers[Math.floor(Math.random() * citizenUsers.length)];
        if (commentUser) {
          await prisma.comment.create({
            data: {
              postId: created.id,
              userId: commentUser.id,
              content: comments[Math.floor(Math.random() * comments.length)],
            },
          });
        }
      }
    }

    // AI审核记录（总是创建，因为上面deleteMany清掉了）
    if (defaultAuditor) {
      await prisma.auditLog.create({
        data: {
          postId: created.id,
          auditorId: defaultAuditor.id,
          action: 'APPROVE',
          riskLevel: (postData as any).isPitfall ? 'MEDIUM' : 'LOW',
          aiScore: (postData as any).isPitfall ? 25 : 10,
          reason: (postData as any).isPitfall ? '涉及商家负面评价，建议核实' : '正常消费分享内容',
        },
      });

    console.log(`   ✅ ${existing ? '更新' : '新增'}: ${postData.title.substring(0, 30)}...`);
  }

  // 4. 补充互助响应
  console.log('🤝 补充互助响应...');
  const helpRequests = await prisma.helpRequest.findMany({ take: 3 });
  let responseCount = 0;

  for (const req of helpRequests) {
    const existingResponses = await prisma.helpResponse.count({ where: { requestId: req.id } });
    if (existingResponses === 0) {
      const numResponses = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numResponses; i++) {
        const responder = citizenUsers[Math.floor(Math.random() * citizenUsers.length)];
        if (responder && responder.id !== req.userId) {
          const respMap: Record<string, string[]> = {
            EMERGENCY: ['我刚才在附近看到过这位老人', '我帮你转发到业主群了', '我也帮着留意一下'],
            SECOND_HAND: ['价格能便宜点吗？', '车子还在吗？想看看实物', '我有兴趣，能上门看吗'],
            SKILL_EXCHANGE: ['我可以教钢琴，有10年教学经验', '我是英语专业的，可以交换', '时间方便的话可以聊聊'],
          };
          const respList = respMap[req.type] || ['我可以帮忙', '有需要联系我'];
          await prisma.helpResponse.create({
            data: {
              requestId: req.id,
              userId: responder.id,
              content: respList[i % respList.length],
              isAccepted: i === 0 && req.type === 'SECOND_HAND',
            },
          });
          responseCount++;
        }
      }

      if (req.type === 'SECOND_HAND') {
        const responses = await prisma.helpResponse.findMany({ where: { requestId: req.id } });
        if (responses.length > 0) {
          await prisma.helpRequest.update({
            where: { id: req.id },
            data: { status: 'CLOSED', closedAt: new Date() },
          });
        }
      }
    }
  }
  console.log(`   ✅ 新增 ${responseCount} 条互助响应`);

  // 5. 补充订阅数据
  console.log('📩 补充便民订阅...');
  const waterService = await prisma.utilityService.findFirst({ where: { type: 'WATER_NOTICE' } });
  const powerService = await prisma.utilityService.findFirst({ where: { type: 'POWER_NOTICE' } });
  let subCount = 0;

  for (const user of citizenUsers.slice(0, 5)) {
    if (waterService) {
      const existing = await prisma.subscription.findFirst({
        where: { userId: user.id, targetId: waterService.id },
      });
      if (!existing) {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            type: 'WATER_NOTICE',
            targetId: waterService.id,
            notify: true,
          },
        });
        subCount++;
      }
    }
    if (powerService) {
      const existing = await prisma.subscription.findFirst({
        where: { userId: user.id, targetId: powerService.id },
      });
      if (!existing) {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            type: 'POWER_NOTICE',
            targetId: powerService.id,
            notify: Math.random() > 0.3,
          },
        });
        subCount++;
      }
    }
  }
  console.log(`   ✅ 新增 ${subCount} 条订阅`);

  // 6. 补充待审核内容（审核工作台数据）
  console.log('🔍 补充待审核内容...');
  const pendingPostsData = [
    {
      title: '网传望京某小区出现新冠肺炎确诊病例？',
      content: '刚才在业主群看到有人说望京西园有确诊，不知道是不是真的？有知道情况的邻居吗？',
      type: 'NEWS',
      sourceLevel: 'ORDINARY',
      riskLevel: 'HIGH',
      aiScore: 85,
      aiReason: '涉及疫情谣言风险，可能引发恐慌',
      isPitfall: false,
      topics: ['#今日望京新鲜事'],
    },
    {
      title: '个人转让闲置物品，有需要的联系',
      content: '家里清理出一些闲置物品，包括电饭煲、电磁炉、书架等，都是九成新的，低价转让。',
      type: 'INFO',
      sourceLevel: 'ORDINARY',
      riskLevel: 'LOW',
      aiScore: 5,
      aiReason: '正常便民信息',
      isPitfall: false,
      topics: ['#便民信息'],
    },
    {
      title: '揭露望京某健身房黑幕！办卡后老板跑路',
      content: '去年在望京某健身房办了年卡，结果才去了三个月老板就跑路了，现在店也关了，钱也退不回来。',
      type: 'REVIEW',
      sourceLevel: 'ORDINARY',
      riskLevel: 'MEDIUM',
      aiScore: 55,
      aiReason: '涉及商家负面评价，建议核实真实性',
      isPitfall: true,
      topics: ['#避坑指南'],
    },
  ];

  let pendingCount = 0;
  for (const postData of pendingPostsData) {
    const existing = await prisma.post.findFirst({ where: { title: postData.title } });
    let created;
    if (existing) {
      created = await prisma.post.update({
        where: { id: existing.id },
        data: {
          status: 'PENDING',
          isPitfall: (postData as any).isPitfall || false,
          sourceLevel: postData.sourceLevel,
        },
      });
      await prisma.auditLog.deleteMany({ where: { postId: existing.id } });
    } else {
      const randomUser = citizenUsers[Math.floor(Math.random() * citizenUsers.length)];
      created = await prisma.post.create({
        data: {
          title: postData.title,
          content: postData.content,
          type: postData.type,
          sourceLevel: postData.sourceLevel,
          status: 'PENDING',
          userId: randomUser?.id,
          latitude: 39.995 + Math.random() * 0.01,
          longitude: 116.47 + Math.random() * 0.01,
          isPitfall: (postData as any).isPitfall || false,
          viewCount: Math.floor(Math.random() * 100) + 10,
          hotScore: 0,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        postId: created.id,
        auditorId: defaultAuditor?.id || '',
        action: 'PENDING',
        riskLevel: (postData as any).riskLevel || 'LOW',
        aiScore: (postData as any).aiScore || 0,
        reason: (postData as any).aiReason || '',
      },
    });

    const topics = (postData as any).topics || [];
    for (const topicName of topics) {
      const topic = await prisma.topic.upsert({
        where: { name: topicName },
        update: { postCount: { increment: existing ? 0 : 1 } },
        create: { name: topicName, category: '资讯', postCount: 1, isHot: false, heatScore: 30 },
      });
      if (!existing) {
        await prisma.postTopic.create({
          data: { postId: created.id, topicId: topic.id },
        });
      }
    }

    pendingCount++;
  }
  console.log(`   ✅ 新增 ${pendingCount} 条待审核内容`);

  // 7. 补充优惠券领取记录
  console.log('🎟️  补充优惠券领取记录...');
  const coupons = await prisma.coupon.findMany({ take: 5 });
  let claimCount = 0;

  for (const coupon of coupons) {
    const numClaims = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < numClaims; i++) {
      const user = citizenUsers[Math.floor(Math.random() * citizenUsers.length)];
      if (user) {
        const existing = await prisma.userCoupon.findFirst({
          where: { userId: user.id, couponId: coupon.id },
        });
        if (!existing) {
          const isUsed = Math.random() > 0.6;
          await prisma.userCoupon.create({
            data: {
              userId: user.id,
              couponId: coupon.id,
              status: isUsed ? 'USED' : 'AVAILABLE',
              usedAt: isUsed ? new Date() : null,
            },
          });
          claimCount++;
        }
      }
    }
  }
  console.log(`   ✅ 新增 ${claimCount} 条优惠券领取记录`);

  // 8. 更新话题热度和postCount
  console.log('🔥 更新话题热度...');
  const allTopics = await prisma.topic.findMany();
  for (const topic of allTopics) {
    const postTopics = await prisma.postTopic.findMany({ where: { topicId: topic.id } });
    let totalHeat = 0;
    for (const pt of postTopics) {
      const post = await prisma.post.findUnique({ where: { id: pt.postId } });
      if (post) {
        totalHeat += post.viewCount * 0.1 + post.likeCount + post.commentCount * 2;
      }
    }
    await prisma.topic.update({
      where: { id: topic.id },
      data: {
        heatScore: totalHeat,
        isHot: totalHeat > 100,
        postCount: postTopics.length,
      },
    });
  }
  console.log(`   ✅ 更新了 ${allTopics.length} 个话题热度`);

  // 9. 更新帖子热度分
  console.log('🔥 更新帖子热度分...');
  const allPosts = await prisma.post.findMany({ where: { status: 'APPROVED' } });
  for (const post of allPosts) {
    const ageInHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
    const decay = Math.exp(-ageInHours / 72);
    const baseScore = post.viewCount * 0.1 + post.likeCount * 1 + post.commentCount * 2 + post.shareCount * 3;
    let hotScore = Math.round(baseScore * decay);
    if (post.sourceLevel === 'GOV') hotScore += 2000;
    if (post.sourceLevel === 'OFFICIAL') hotScore += 1000;
    if (post.type === 'EMERGENCY') hotScore += 800;
    await prisma.post.update({
      where: { id: post.id },
      data: { hotScore },
    });
  }
  console.log(`   ✅ 更新了 ${allPosts.length} 篇帖子热度分`);

  console.log();
  console.log('✅ 业务闭环数据构建完成！');
  console.log();

  // 统计
  const stats = {
    posts: await prisma.post.count(),
    approved: await prisma.post.count({ where: { status: 'APPROVED' } }),
    pending: await prisma.post.count({ where: { status: 'PENDING' } }),
    topics: await prisma.topic.count(),
    merchants: await prisma.merchant.count(),
    coupons: await prisma.coupon.count(),
    helpRequests: await prisma.helpRequest.count(),
    helpResponses: await prisma.helpResponse.count(),
    auditLogs: await prisma.auditLog.count(),
    subscriptions: await prisma.subscription.count(),
    userCoupons: await prisma.userCoupon.count(),
    comments: await prisma.comment.count(),
  };

  console.log('📊 数据统计：');
  for (const [key, value] of Object.entries(stats)) {
    console.log(`   ${key}: ${value}`);
  }

  console.log();
  console.log('📰 信源等级分布：');
  const sourceLevels = ['GOV', 'OFFICIAL', 'V', 'ORDINARY'];
  for (const level of sourceLevels) {
    const count = await prisma.post.count({ where: { sourceLevel: level } });
    console.log(`   ${level}: ${count} 篇`);
  }

  console.log();
  console.log('📑 帖子类型分布：');
  const types = ['NOTICE', 'NEWS', 'REVIEW', 'ACTIVITY', 'INFO', 'EMERGENCY'];
  for (const t of types) {
    const count = await prisma.post.count({ where: { type: t } });
    console.log(`   ${t}: ${count} 篇`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
