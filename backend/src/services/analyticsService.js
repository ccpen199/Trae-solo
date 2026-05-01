const { Op } = require('sequelize');
const moment = require('moment');
const { DailyActiveUser, RetentionStats, AuditLog, AdReconciliation } = require('../models');
const { User, Content, Interaction, Comment } = require('../models');
const { Recommendation, AdDelivery } = require('../models');
const { NegativeFeedback } = require('../models');
const logger = require('../utils/logger');

const calculateDAU = async (date = new Date()) => {
  const targetDate = moment(date).format('YYYY-MM-DD');
  const startOfDay = moment(targetDate).startOf('day').toDate();
  const endOfDay = moment(targetDate).endOf('day').toDate();
  
  const activeUsers = await Interaction.findAll({
    where: {
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    },
    attributes: ['userId'],
    group: ['userId']
  });
  
  const activeUserIds = activeUsers.map(u => u.userId);
  
  const newUsers = await User.findAll({
    where: {
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });
  
  const interactionsByHour = await Interaction.findAll({
    where: {
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    },
    attributes: [
      [Interaction.sequelize.fn('HOUR', Interaction.sequelize.col('createdAt')), 'hour'],
      [Interaction.sequelize.fn('COUNT', Interaction.sequelize.fn('DISTINCT', Interaction.sequelize.col('userId'))), 'count']
    ],
    group: [Interaction.sequelize.fn('HOUR', Interaction.sequelize.col('createdAt'))]
  });
  
  const activeUsersByHour = {};
  interactionsByHour.forEach(item => {
    activeUsersByHour[item.dataValues.hour] = item.dataValues.count;
  });
  
  const totalSessions = await Interaction.findAll({
    where: {
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    },
    attributes: [
      [Interaction.sequelize.fn('COUNT', Interaction.sequelize.fn('DISTINCT', Interaction.sequelize.col('sessionId'))), 'count']
    ]
  });
  
  const totalPageViews = await Interaction.count({
    where: {
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });
  
  const totalContentViews = await Interaction.count({
    where: {
      type: 'view',
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });
  
  const totalLikes = await Interaction.count({
    where: {
      type: 'like',
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });
  
  const totalComments = await Comment.count({
    where: {
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });
  
  const totalShares = await Interaction.count({
    where: {
      type: 'share',
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });
  
  const totalNegativeFeedbacks = await NegativeFeedback.count({
    where: {
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });
  
  const totalRecommendations = await Recommendation.count({
    where: {
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });
  
  const clickedRecommendations = await Recommendation.count({
    where: {
      status: 'clicked',
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });
  
  const deliveredRecommendations = await Recommendation.count({
    where: {
      isDelivered: true,
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });
  
  const dau = await DailyActiveUser.create({
    date: targetDate,
    dau: activeUserIds.length,
    newUsers: newUsers.length,
    activeUsersByHour,
    totalSessions: totalSessions[0]?.dataValues?.count || 0,
    avgSessionDuration: 0,
    totalPageViews,
    totalContentViews,
    avgReadDuration: 0,
    totalLikes,
    totalComments,
    totalShares,
    totalNegativeFeedbacks,
    totalRecommendations,
    clickedRecommendations,
    recommendationCtr: deliveredRecommendations > 0 ? clickedRecommendations / deliveredRecommendations : 0
  });
  
  logger.info('DAU统计完成', {
    date: targetDate,
    dau: activeUserIds.length,
    newUsers: newUsers.length
  });
  
  return dau;
};

const calculateRetention = async (cohortDate) => {
  const targetDate = moment(cohortDate).format('YYYY-MM-DD');
  const startOfDay = moment(targetDate).startOf('day').toDate();
  const endOfDay = moment(targetDate).endOf('day').toDate();
  
  const cohortUsers = await User.findAll({
    where: {
      createdAt: { [Op.between]: [startOfDay, endOfDay] }
    },
    attributes: ['id', 'createdAt']
  });
  
  if (cohortUsers.length === 0) {
    return null;
  }
  
  const cohortUserIds = cohortUsers.map(u => u.id);
  
  const getActiveUsersOnDay = (daysOffset) => {
    const targetDay = moment(targetDate).add(daysOffset, 'days').format('YYYY-MM-DD');
    const dayStart = moment(targetDay).startOf('day').toDate();
    const dayEnd = moment(targetDay).endOf('day').toDate();
    
    return Interaction.findAll({
      where: {
        userId: { [Op.in]: cohortUserIds },
        createdAt: { [Op.between]: [dayStart, dayEnd] }
      },
      attributes: ['userId'],
      group: ['userId']
    });
  };
  
  const [day1Users, day3Users, day7Users, day14Users, day30Users] = await Promise.all([
    getActiveUsersOnDay(1),
    getActiveUsersOnDay(3),
    getActiveUsersOnDay(7),
    getActiveUsersOnDay(14),
    getActiveUsersOnDay(30)
  ]);
  
  const totalUsers = cohortUsers.length;
  
  const retention = await RetentionStats.create({
    cohortDate: targetDate,
    totalUsers,
    day1Retention: totalUsers > 0 ? day1Users.length / totalUsers : 0,
    day3Retention: totalUsers > 0 ? day3Users.length / totalUsers : 0,
    day7Retention: totalUsers > 0 ? day7Users.length / totalUsers : 0,
    day14Retention: totalUsers > 0 ? day14Users.length / totalUsers : 0,
    day30Retention: totalUsers > 0 ? day30Users.length / totalUsers : 0,
    day1Active: day1Users.length,
    day3Active: day3Users.length,
    day7Active: day7Users.length,
    day14Active: day14Users.length,
    day30Active: day30Users.length
  });
  
  logger.info('留存统计完成', {
    cohortDate: targetDate,
    totalUsers,
    day1Retention: retention.day1Retention
  });
  
  return retention;
};

const getDAURange = async (startDate, endDate) => {
  return DailyActiveUser.findAll({
    where: {
      date: { [Op.between]: [startDate, endDate] }
    },
    order: [['date', 'ASC']]
  });
};

const getRetentionStats = async (options = {}) => {
  const { startDate, endDate, limit = 30 } = options;
  
  const where = {};
  if (startDate) {
    where.cohortDate = { ...where.cohortDate, [Op.gte]: startDate };
  }
  if (endDate) {
    where.cohortDate = { ...where.cohortDate, [Op.lte]: endDate };
  }
  
  return RetentionStats.findAll({
    where,
    order: [['cohortDate', 'DESC']],
    limit
  });
};

const getAuditLogs = async (options = {}) => {
  const {
    eventType,
    userId,
    targetType,
    targetId,
    startDate,
    endDate,
    status,
    page = 1,
    pageSize = 20
  } = options;
  
  const where = {};
  
  if (eventType) where.eventType = eventType;
  if (userId) where.userId = userId;
  if (targetType) where.targetType = targetType;
  if (targetId) where.targetId = targetId;
  if (status) where.status = status;
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  }
  
  const offset = (page - 1) * pageSize;
  
  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: pageSize,
    offset
  });
  
  return {
    logs: rows,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  };
};

const getAdReconciliations = async (options = {}) => {
  const {
    advertiserId,
    campaignId,
    startDate,
    endDate,
    status,
    page = 1,
    pageSize = 20
  } = options;
  
  const where = {};
  
  if (advertiserId) where.advertiserId = advertiserId;
  if (campaignId) where.campaignId = campaignId;
  if (status) where.status = status;
  
  if (startDate) {
    where.date = { ...where.date, [Op.gte]: startDate };
  }
  if (endDate) {
    where.date = { ...where.date, [Op.lte]: endDate };
  }
  
  const offset = (page - 1) * pageSize;
  
  const { count, rows } = await AdReconciliation.findAndCountAll({
    where,
    order: [['date', 'DESC']],
    limit: pageSize,
    offset
  });
  
  return {
    reconciliations: rows,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  };
};

const getContentOverview = async (options = {}) => {
  const { startDate, endDate } = options;
  
  const where = {};
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  }
  
  const totalContent = await Content.count({ where });
  const publishedContent = await Content.count({
    where: { ...where, status: 'published' }
  });
  const toRecommendContent = await Content.count({
    where: { ...where, status: 'to_recommend' }
  });
  const duplicateContent = await Content.count({
    where: { ...where, isDuplicate: true }
  });
  
  const totalViews = await Content.sum('viewCount', { where }) || 0;
  const totalLikes = await Content.sum('likeCount', { where }) || 0;
  const totalComments = await Content.sum('commentCount', { where }) || 0;
  const totalShares = await Content.sum('shareCount', { where }) || 0;
  
  return {
    total: totalContent,
    published: publishedContent,
    toRecommend: toRecommendContent,
    duplicate: duplicateContent,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    engagement: totalViews > 0 ? (totalLikes + totalComments + totalShares) / totalViews : 0
  };
};

const getUserOverview = async (options = {}) => {
  const { startDate, endDate } = options;
  
  const where = {};
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  }
  
  const totalUsers = await User.count();
  const activeUsers = await User.count({
    where: { status: 'active' }
  });
  const newUsers = await User.count({ where });
  
  const usersByRole = await User.findAll({
    attributes: ['role', [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']],
    group: ['role']
  });
  
  return {
    total: totalUsers,
    active: activeUsers,
    new: newUsers,
    byRole: usersByRole.reduce((acc, item) => {
      acc[item.role] = item.dataValues.count;
      return acc;
    }, {})
  };
};

const getSystemHealth = async () => {
  const { sequelize } = require('../models');
  
  let dbStatus = 'healthy';
  let dbLatency = 0;
  
  try {
    const startTime = Date.now();
    await sequelize.authenticate();
    dbLatency = Date.now() - startTime;
  } catch (error) {
    dbStatus = 'unhealthy';
  }
  
  let redisStatus = 'healthy';
  let redisLatency = 0;
  
  try {
    const { redisClient } = require('../config/redis');
    const startTime = Date.now();
    await redisClient.ping();
    redisLatency = Date.now() - startTime;
  } catch (error) {
    redisStatus = 'unhealthy';
  }
  
  return {
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatency
    },
    redis: {
      status: redisStatus,
      latencyMs: redisLatency
    },
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal
    },
    uptime: process.uptime()
  };
};

module.exports = {
  calculateDAU,
  calculateRetention,
  getDAURange,
  getRetentionStats,
  getAuditLogs,
  getAdReconciliations,
  getContentOverview,
  getUserOverview,
  getSystemHealth
};
