const { Op } = require('sequelize');
const { NegativeFeedback, FeedbackTagImpact } = require('../models');
const { Content, User } = require('../models');
const { UserProfile } = require('../models');
const logger = require('../utils/logger');
const { trackNegativeFeedback } = require('../utils/audit');

const NEGATIVE_FEEDBACK_CONFIG = {
  defaultImpactWeight: 0.3,
  typeImpactWeights: {
    not_interested: 0.3,
    already_seen: 0.1,
    low_quality: 0.4,
    misleading: 0.5,
    offensive: 0.6,
    other: 0.2
  },
  tagDecayDays: 30,
  maxTagImpact: 0.8,
  minTagWeight: 0.01
};

const createNegativeFeedback = async (options) => {
  const {
    userId,
    contentId,
    type = 'not_interested',
    reason = null,
    recommendationId = null,
    sessionId = null,
    userIp = null,
    userAgent = null
  } = options;
  
  try {
    const existingFeedback = await NegativeFeedback.findOne({
      where: {
        userId,
        contentId,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    if (existingFeedback) {
      logger.info('用户已提交过负反馈', { userId, contentId, type });
      return {
        feedback: existingFeedback,
        isNew: false
      };
    }
    
    const impactWeight = NEGATIVE_FEEDBACK_CONFIG.typeImpactWeights[type] || 
                         NEGATIVE_FEEDBACK_CONFIG.defaultImpactWeight;
    
    const feedback = await NegativeFeedback.create({
      userId,
      contentId,
      type,
      reason,
      recommendationId,
      sessionId,
      impactWeight,
      isProcessed: false,
      userIp,
      userAgent
    });
    
    await trackNegativeFeedback(userId, contentId, type);
    
    await processNegativeFeedback(feedback);
    
    logger.info('负反馈已创建', {
      feedbackId: feedback.id,
      userId,
      contentId,
      type,
      impactWeight
    });
    
    return {
      feedback,
      isNew: true
    };
  } catch (error) {
    logger.error('创建负反馈失败', error);
    throw error;
  }
};

const processNegativeFeedback = async (feedback) => {
  try {
    const { userId, contentId, impactWeight, id: feedbackId } = feedback;
    
    const userProfile = await UserProfile.findOne({
      where: { userId }
    });
    
    if (!userProfile) {
      logger.warn('用户画像不存在，跳过负反馈处理', { userId });
      return;
    }
    
    const content = await Content.findByPk(contentId);
    
    if (!content) {
      logger.warn('内容不存在，跳过负反馈处理', { contentId });
      return;
    }
    
    const contentTags = [
      ...(content.semanticTags || []),
      ...(content.keywords || []),
      ...(content.categoryTags || [])
    ];
    
    const uniqueTags = [...new Set(contentTags)];
    
    const processingResult = {
      tagsAdjusted: [],
      weightsUpdated: {}
    };
    
    const currentInterests = { ...(userProfile.interests || {}) };
    const currentCategoryPreferences = { ...(userProfile.categoryPreferences || {}) };
    
    for (const tag of uniqueTags) {
      if (currentInterests[tag] !== undefined) {
        const originalWeight = currentInterests[tag];
        const adjustment = -impactWeight * Math.min(originalWeight, 1);
        let newWeight = originalWeight + adjustment;
        newWeight = Math.max(newWeight, NEGATIVE_FEEDBACK_CONFIG.minTagWeight);
        newWeight = Math.min(newWeight, 10);
        
        currentInterests[tag] = newWeight;
        
        processingResult.tagsAdjusted.push(tag);
        processingResult.weightsUpdated[tag] = {
          original: originalWeight,
          new: newWeight,
          adjustment
        };
        
        await FeedbackTagImpact.create({
          feedbackId,
          userId,
          tag,
          tagType: 'semantic',
          originalWeight,
          newWeight,
          adjustment,
          isEffective: true,
          expiresAt: new Date(Date.now() + NEGATIVE_FEEDBACK_CONFIG.tagDecayDays * 24 * 60 * 60 * 1000)
        });
      }
    }
    
    if (content.categoryId) {
      const categoryKey = content.categoryId;
      
      if (currentCategoryPreferences[categoryKey] !== undefined) {
        const originalWeight = currentCategoryPreferences[categoryKey];
        const adjustment = -impactWeight * 0.5 * Math.min(originalWeight, 1);
        let newWeight = originalWeight + adjustment;
        newWeight = Math.max(newWeight, NEGATIVE_FEEDBACK_CONFIG.minTagWeight);
        
        currentCategoryPreferences[categoryKey] = newWeight;
        
        processingResult.weightsUpdated[`category_${categoryKey}`] = {
          original: originalWeight,
          new: newWeight,
          adjustment
        };
      }
    }
    
    const negativeFeedbacks = [
      ...(userProfile.negativeFeedbacks || []),
      {
        contentId,
        reason: feedback.type,
        timestamp: new Date().toISOString(),
        impactWeight
      }
    ].slice(-100);
    
    await userProfile.update({
      interests: currentInterests,
      categoryPreferences: currentCategoryPreferences,
      negativeFeedbacks
    });
    
    await feedback.update({
      isProcessed: true,
      processedAt: new Date(),
      processingResult
    });
    
    logger.info('负反馈处理完成', {
      feedbackId,
      userId,
      tagsAdjusted: processingResult.tagsAdjusted.length
    });
    
    return processingResult;
  } catch (error) {
    logger.error('处理负反馈失败', error);
    throw error;
  }
};

const applyDecayToTagImpacts = async () => {
  const now = new Date();
  
  const expiredImpacts = await FeedbackTagImpact.findAll({
    where: {
      isEffective: true,
      expiresAt: { [Op.lte]: now }
    }
  });
  
  for (const impact of expiredImpacts) {
    const userProfile = await UserProfile.findOne({
      where: { userId: impact.userId }
    });
    
    if (userProfile && userProfile.interests) {
      const currentWeight = userProfile.interests[impact.tag];
      
      if (currentWeight !== undefined) {
        const recoveryAmount = impact.adjustment * 0.5;
        const newWeight = Math.max(
          currentWeight - recoveryAmount,
          NEGATIVE_FEEDBACK_CONFIG.minTagWeight
        );
        
        await userProfile.update({
          interests: {
            ...userProfile.interests,
            [impact.tag]: newWeight
          }
        });
        
        await impact.update({ isEffective: false });
        
        logger.info('负反馈影响已衰减恢复', {
          impactId: impact.id,
          userId: impact.userId,
          tag: impact.tag
        });
      }
    }
  }
  
  return expiredImpacts.length;
};

const getNegativeFeedbackStats = async (userId, options = {}) => {
  const { startDate, endDate, type } = options;
  
  const where = { userId };
  
  if (type) {
    where.type = type;
  }
  if (startDate) {
    where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  }
  
  const totalFeedbacks = await NegativeFeedback.count({ where });
  
  const processedCount = await NegativeFeedback.count({
    where: { ...where, isProcessed: true }
  });
  
  const typeCounts = await NegativeFeedback.findAll({
    where,
    attributes: ['type', [NegativeFeedback.sequelize.fn('COUNT', NegativeFeedback.sequelize.col('id')), 'count']],
    group: ['type']
  });
  
  return {
    total: totalFeedbacks,
    processed: processedCount,
    unprocessed: totalFeedbacks - processedCount,
    byType: typeCounts.reduce((acc, item) => {
      acc[item.type] = item.dataValues.count;
      return acc;
    }, {})
  };
};

const getUserNegativeFeedbackHistory = async (userId, options = {}) => {
  const { page = 1, pageSize = 20, type } = options;
  
  const where = { userId };
  
  if (type) {
    where.type = type;
  }
  
  const offset = (page - 1) * pageSize;
  
  const { count, rows } = await NegativeFeedback.findAndCountAll({
    where,
    include: [
      {
        association: 'content',
        attributes: ['id', 'title', 'coverImage', 'author']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: pageSize,
    offset
  });
  
  return {
    feedbacks: rows,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  };
};

const getContentNegativeFeedbackStats = async (contentId, options = {}) => {
  const { startDate, endDate } = options;
  
  const where = { contentId };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  }
  
  const totalFeedbacks = await NegativeFeedback.count({ where });
  
  const typeCounts = await NegativeFeedback.findAll({
    where,
    attributes: ['type', [NegativeFeedback.sequelize.fn('COUNT', NegativeFeedback.sequelize.col('id')), 'count']],
    group: ['type']
  });
  
  const uniqueUsers = await NegativeFeedback.findAll({
    where,
    attributes: [[NegativeFeedback.sequelize.fn('DISTINCT', NegativeFeedback.sequelize.col('userId')), 'userId']]
  });
  
  return {
    total: totalFeedbacks,
    uniqueUsers: uniqueUsers.length,
    byType: typeCounts.reduce((acc, item) => {
      acc[item.type] = item.dataValues.count;
      return acc;
    }, {})
  };
};

module.exports = {
  NEGATIVE_FEEDBACK_CONFIG,
  createNegativeFeedback,
  processNegativeFeedback,
  applyDecayToTagImpacts,
  getNegativeFeedbackStats,
  getUserNegativeFeedbackHistory,
  getContentNegativeFeedbackStats
};
