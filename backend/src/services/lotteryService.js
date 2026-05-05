const prisma = require('../config/database');
const { getRedis } = require('../config/redis');
const { weightedRandom, generateParticipationNo } = require('../utils/probability');
const { withLock } = require('../utils/lock');
const pointsService = require('./pointsService');

// 抽奖服务 - 核心抽奖逻辑

// 获取或创建用户参与记录
const getOrCreateParticipation = async (userId, activity) => {
  const now = new Date();
  
  // 检查活动是否在有效期内
  if (now < activity.startTime) {
    throw new Error('活动尚未开始');
  }
  if (now >= activity.endTime) {
    throw new Error('活动已结束');
  }
  
  // 查找今天的参与记录
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let participation = await prisma.activityParticipation.findFirst({
    where: {
      userId,
      activityId: activity.id,
      createdAt: { gte: todayStart },
    },
  });
  
  if (!participation) {
    // 创建新的参与记录
    participation = await prisma.activityParticipation.create({
      data: {
        userId,
        activityId: activity.id,
        participationNo: generateParticipationNo(),
        chancesUsed: 0,
        chancesTotal: activity.maxChances,
        pointsSpent: 0,
      },
    });
  }
  
  return participation;
};

// 执行抽奖
const executeLottery = async (userId, activityType) => {
  const lockKey = `lottery:${userId}:${Date.now()}`;
  
  return withLock(lockKey, async () => {
    // 获取当前活动
    const activity = await prisma.activity.findFirst({
      where: {
        type: activityType,
        status: 'ACTIVE',
      },
      include: {
        prizes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    
    if (!activity) {
      throw new Error('暂无进行中的活动');
    }
    
    // 获取或创建参与记录
    const participation = await getOrCreateParticipation(userId, activity);
    
    // 检查是否还有机会
    if (participation.chancesUsed >= participation.chancesTotal) {
      throw new Error('今日抽奖机会已用完');
    }
    
    // 检查积分是否足够
    const hasEnoughPoints = await pointsService.checkBalance(userId, activity.pointsCost);
    if (!hasEnoughPoints) {
      throw new Error('INSUFFICIENT_POINTS');
    }
    
    // 扣减积分
    await pointsService.deductPoints(
      userId,
      activity.pointsCost,
      `参与${activity.type === 'WHEEL' ? '大转盘' : '砸蛋'}活动`,
      activity.id,
      'ACTIVITY'
    );
    
    // 按概率选择奖品
    const availablePrizes = activity.prizes.filter(prize => {
      // 谢谢参与不检查库存
      if (prize.type === 'THANKYOU') return true;
      // 检查库存
      return prize.stock > prize.used;
    });
    
    if (availablePrizes.length === 0) {
      throw new Error('奖品已抽完');
    }
    
    const selectedPrize = weightedRandom(availablePrizes);
    
    if (!selectedPrize) {
      throw new Error('抽奖失败，请稍后重试');
    }
    
    // 更新库存和使用计数
    if (selectedPrize.type !== 'THANKYOU') {
      await prisma.activityPrize.update({
        where: { id: selectedPrize.id },
        data: { used: { increment: 1 } },
      });
    }
    
    // 更新参与记录
    const updatedParticipation = await prisma.activityParticipation.update({
      where: { id: participation.id },
      data: {
        chancesUsed: { increment: 1 },
        pointsSpent: { increment: activity.pointsCost },
      },
    });
    
    // 记录中奖
    const userPrize = await prisma.userPrize.create({
      data: {
        userId,
        activityId: activity.id,
        prizeId: selectedPrize.id,
        prizeName: selectedPrize.name,
        prizeType: selectedPrize.type,
        pointsValue: selectedPrize.pointsValue,
        receiveStatus: selectedPrize.type === 'POINTS' ? 'RECEIVED' : 'PENDING',
        receiveTime: selectedPrize.type === 'POINTS' ? new Date() : null,
      },
    });
    
    // 如果是积分奖品，自动发放
    if (selectedPrize.type === 'POINTS' && selectedPrize.pointsValue > 0) {
      await pointsService.addPoints(
        userId,
        selectedPrize.pointsValue,
        `${activity.type === 'WHEEL' ? '大转盘' : '砸蛋'}活动中奖`,
        userPrize.id,
        'PRIZE'
      );
    }
    
    // 计算剩余机会
    const remainingChances = updatedParticipation.chancesTotal - updatedParticipation.chancesUsed;
    
    return {
      prize: {
        id: userPrize.id,
        name: selectedPrize.name,
        type: selectedPrize.type,
        imageUrl: selectedPrize.imageUrl,
        pointsValue: selectedPrize.pointsValue,
      },
      isWinner: selectedPrize.type !== 'THANKYOU',
      remainingChances,
      userPrizeId: userPrize.id,
    };
  }, 30000);
};

// 获取用户奖品列表
const getUserPrizes = async (userId, status, page = 1, pageSize = 20) => {
  const skip = (page - 1) * pageSize;
  
  const where = { userId };
  if (status) {
    where.receiveStatus = status;
  }
  
  const [prizes, total] = await Promise.all([
    prisma.userPrize.findMany({
      where,
      include: {
        prize: {
          select: {
            imageUrl: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.userPrize.count({ where }),
  ]);
  
  return {
    list: prizes,
    total,
    page,
    pageSize,
  };
};

// 领取奖品
const receivePrize = async (userId, prizeId) => {
  const userPrize = await prisma.userPrize.findUnique({
    where: { id: prizeId },
  });
  
  if (!userPrize) {
    throw new Error('奖品不存在');
  }
  
  if (userPrize.userId !== userId) {
    throw new Error('无权领取此奖品');
  }
  
  if (userPrize.receiveStatus !== 'PENDING') {
    throw new Error('奖品状态不正确');
  }
  
  // 如果是积分类型，自动发放积分
  if (userPrize.prizeType === 'POINTS' && userPrize.pointsValue > 0) {
    await pointsService.addPoints(
      userId,
      userPrize.pointsValue,
      '领取活动奖品',
      userPrize.id,
      'PRIZE'
    );
  }
  
  return prisma.userPrize.update({
    where: { id: prizeId },
    data: {
      receiveStatus: 'RECEIVED',
      receiveTime: new Date(),
    },
  });
};

// 立即兑换积分奖品（用于砸蛋活动）
const redeemPointsPrize = async (userId, userPrizeId) => {
  const userPrize = await prisma.userPrize.findUnique({
    where: { id: userPrizeId },
  });
  
  if (!userPrize) {
    throw new Error('奖品不存在');
  }
  
  if (userPrize.userId !== userId) {
    throw new Error('无权兑换此奖品');
  }
  
  if (userPrize.prizeType !== 'POINTS') {
    throw new Error('只能兑换积分类型奖品');
  }
  
  if (userPrize.receiveStatus === 'RECEIVED') {
    throw new Error('奖品已兑换');
  }
  
  // 发放积分
  await pointsService.addPoints(
    userId,
    userPrize.pointsValue,
    '砸蛋活动奖品兑换',
    userPrize.id,
    'PRIZE'
  );
  
  // 更新状态
  return prisma.userPrize.update({
    where: { id: userPrizeId },
    data: {
      receiveStatus: 'RECEIVED',
      receiveTime: new Date(),
    },
  });
};

module.exports = {
  executeLottery,
  getOrCreateParticipation,
  getUserPrizes,
  receivePrize,
  redeemPointsPrize,
};
