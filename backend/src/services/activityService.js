const prisma = require('../config/database');
const { validateProbability } = require('../utils/probability');

// 活动服务 - 活动配置管理

// 创建活动
const createActivity = async (data) => {
  const { type, name, description, startTime, endTime, pointsCost, maxChances, prizes } = data;
  
  // 验证奖品概率
  if (prizes && prizes.length > 0) {
    const validation = validateProbability(prizes);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
  }
  
  return prisma.$transaction(async (tx) => {
    // 创建活动
    const activity = await tx.activity.create({
      data: {
        type,
        name,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        pointsCost: parseInt(pointsCost) || 0,
        maxChances: parseInt(maxChances) || 1,
        status: 'DRAFT',
      },
    });
    
    // 创建奖品
    if (prizes && prizes.length > 0) {
      const prizeData = prizes.map((prize, index) => ({
        activityId: activity.id,
        name: prize.name,
        description: prize.description,
        imageUrl: prize.imageUrl,
        type: prize.type,
        pointsValue: prize.pointsValue ? parseInt(prize.pointsValue) : null,
        probability: parseFloat(prize.probability) || 0,
        stock: parseInt(prize.stock) || 0,
        used: 0,
        sortOrder: index,
      }));
      
      await tx.activityPrize.createMany({
        data: prizeData,
      });
    }
    
    return getActivityById(activity.id);
  });
};

// 更新活动
const updateActivity = async (id, data) => {
  const { name, description, startTime, endTime, pointsCost, maxChances, status, prizes } = data;
  
  return prisma.$transaction(async (tx) => {
    // 更新活动基本信息
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (pointsCost !== undefined) updateData.pointsCost = parseInt(pointsCost);
    if (maxChances !== undefined) updateData.maxChances = parseInt(maxChances);
    if (status !== undefined) updateData.status = status;
    
    const activity = await tx.activity.update({
      where: { id },
      data: updateData,
    });
    
    // 更新奖品（先删除再创建）
    if (prizes !== undefined) {
      // 验证概率
      if (prizes.length > 0) {
        const validation = validateProbability(prizes);
        if (!validation.valid) {
          throw new Error(validation.message);
        }
      }
      
      // 删除旧奖品
      await tx.activityPrize.deleteMany({
        where: { activityId: id },
      });
      
      // 创建新奖品
      if (prizes.length > 0) {
        const prizeData = prizes.map((prize, index) => ({
          activityId: activity.id,
          name: prize.name,
          description: prize.description,
          imageUrl: prize.imageUrl,
          type: prize.type,
          pointsValue: prize.pointsValue ? parseInt(prize.pointsValue) : null,
          probability: parseFloat(prize.probability) || 0,
          stock: parseInt(prize.stock) || 0,
          used: 0,
          sortOrder: index,
        }));
        
        await tx.activityPrize.createMany({
          data: prizeData,
        });
      }
    }
    
    return getActivityById(activity.id);
  });
};

// 获取活动详情
const getActivityById = async (id) => {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      prizes: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
  
  if (!activity) return null;
  
  // 计算参与人数和中奖人数
  const [participantCount, winnerCount] = await Promise.all([
    prisma.activityParticipation.count({
      where: { activityId: id },
    }),
    prisma.userPrize.count({
      where: {
        activityId: id,
        prizeType: { not: 'THANKYOU' },
      },
    }),
  ]);
  
  return {
    ...activity,
    participantCount,
    winnerCount,
  };
};

// 获取当前进行中的活动
const getActiveActivity = async (type) => {
  const now = new Date();
  const activities = await prisma.activity.findMany({
    where: {
      type,
      status: 'ACTIVE',
      startTime: { lte: now },
      endTime: { gt: now },
    },
    include: {
      prizes: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { startTime: 'desc' },
    take: 1,
  });
  
  if (activities.length === 0) return null;
  
  const activity = activities[0];
  
  // 计算参与人数和中奖人数
  const [participantCount, winnerCount] = await Promise.all([
    prisma.activityParticipation.count({
      where: { activityId: activity.id },
    }),
    prisma.userPrize.count({
      where: {
        activityId: activity.id,
        prizeType: { not: 'THANKYOU' },
      },
    }),
  ]);
  
  return {
    ...activity,
    participantCount,
    winnerCount,
  };
};

// 获取活动列表
const getActivityList = async (type, page = 1, pageSize = 10) => {
  const skip = (page - 1) * pageSize;
  
  const where = type ? { type } : {};
  
  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        prizes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.activity.count({ where }),
  ]);
  
  return {
    list: activities,
    total,
    page,
    pageSize,
  };
};

// 删除活动
const deleteActivity = async (id) => {
  return prisma.$transaction(async (tx) => {
    // 检查是否有参与记录
    const participationCount = await tx.activityParticipation.count({
      where: { activityId: id },
    });
    
    if (participationCount > 0) {
      throw new Error('活动已有参与记录，无法删除');
    }
    
    // 删除奖品
    await tx.activityPrize.deleteMany({
      where: { activityId: id },
    });
    
    // 删除活动
    return tx.activity.delete({
      where: { id },
    });
  });
};

// 获取最近中奖公告
const getRecentWinners = async (type, limit = 10) => {
  const now = new Date();
  
  // 先获取当前活动
  const activeActivity = await prisma.activity.findFirst({
    where: {
      type,
      status: 'ACTIVE',
      startTime: { lte: now },
      endTime: { gt: now },
    },
  });
  
  if (!activeActivity) return [];
  
  const winners = await prisma.userPrize.findMany({
    where: {
      activityId: activeActivity.id,
      prizeType: { not: 'THANKYOU' },
    },
    include: {
      user: {
        select: {
          nickname: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  
  return winners.map(winner => ({
    id: winner.id,
    username: winner.user.nickname || winner.user.username,
    prizeName: winner.prizeName,
    createdAt: winner.createdAt,
  }));
};

module.exports = {
  createActivity,
  updateActivity,
  getActivityById,
  getActiveActivity,
  getActivityList,
  deleteActivity,
  getRecentWinners,
};
