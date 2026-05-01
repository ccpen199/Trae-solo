const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Content, User, Category, WeightTag } = require('../models');
const { UserProfile, Recommendation } = require('../models');
const logger = require('../utils/logger');
const { redisClient } = require('../config/redis');

const ALGORITHM_VERSION = 'v1.0.0';
const RECOMMENDATION_CONFIG = {
  feedSize: 20,
  contentWeight: 0.4,
  userProfileWeight: 0.4,
  hotWeight: 0.2,
  minScore: 0.01,
  deduplicationDays: 7,
  diversityFactor: 0.3,
  coldStartThreshold: 5
};

const generateRecommendationId = () => {
  return `REC-${Date.now()}-${uuidv4().substring(0, 12)}`;
};

const calculateContentScore = (content, userProfile) => {
  let score = 0;
  
  score += content.recommendationWeight * RECOMMENDATION_CONFIG.contentWeight;
  
  if (content.hotScore > 0) {
    const normalizedHotScore = Math.min(content.hotScore / 100, 1);
    score += normalizedHotScore * RECOMMENDATION_CONFIG.hotWeight;
  }
  
  if (userProfile && userProfile.interests) {
    const contentTags = [
      ...(content.semanticTags || []),
      ...(content.keywords || [])
    ];
    
    let matchScore = 0;
    let totalWeight = 0;
    
    for (const [tag, weight] of Object.entries(userProfile.interests)) {
      totalWeight += weight;
      if (contentTags.includes(tag)) {
        matchScore += weight;
      }
    }
    
    if (totalWeight > 0) {
      score += (matchScore / totalWeight) * RECOMMENDATION_CONFIG.userProfileWeight;
    }
  }
  
  if (userProfile && userProfile.categoryPreferences && content.categoryId) {
    const categoryWeight = userProfile.categoryPreferences[content.categoryId] || 0;
    if (categoryWeight > 0) {
      score += categoryWeight * 0.1;
    }
  }
  
  if (content.weightTags && content.weightTags.length > 0) {
    content.weightTags.forEach(tag => {
      score *= tag.weightValue || 1;
    });
  }
  
  const ageHours = (Date.now() - new Date(content.publishTime || content.createdAt).getTime()) / (1000 * 60 * 60);
  const timeDecay = Math.exp(-ageHours / 72);
  score *= timeDecay;
  
  return Math.max(score, 0);
};

const getUserProfile = async (userId) => {
  let profile = await UserProfile.findOne({
    where: { userId },
    include: [{ association: 'user', attributes: ['id', 'username', 'role'] }]
  });
  
  if (!profile) {
    profile = await UserProfile.create({
      userId,
      interests: {},
      categoryPreferences: {},
      readHistory: [],
      clickHistory: [],
      negativeFeedbacks: [],
      preferenceVector: []
    });
  }
  
  return profile;
};

const getCandidateContents = async (userId, excludeIds = []) => {
  const whereClause = {
    status: 'published',
    isDuplicate: false
  };
  
  if (excludeIds && excludeIds.length > 0) {
    whereClause.id = { [Op.notIn]: excludeIds };
  }
  
  const contents = await Content.findAll({
    where: whereClause,
    include: [
      { association: 'category', attributes: ['id', 'name'] }
    ],
    order: [
      ['publishTime', 'DESC'],
      ['hotScore', 'DESC']
    ],
    limit: 200
  });
  
  return contents;
};

const getRecentRecommendations = async (userId, days = RECOMMENDATION_CONFIG.deduplicationDays) => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const recommendations = await Recommendation.findAll({
    where: {
      userId,
      createdAt: { [Op.gte]: cutoffDate }
    },
    attributes: ['contentId']
  });
  
  return recommendations.map(r => r.contentId);
};

const applyDiversity = (candidates, userProfile) => {
  const categoryGroups = {};
  
  candidates.forEach(candidate => {
    const categoryId = candidate.categoryId || 'unknown';
    if (!categoryGroups[categoryId]) {
      categoryGroups[categoryId] = [];
    }
    categoryGroups[categoryId].push(candidate);
  });
  
  const categoryCount = Object.keys(categoryGroups).length;
  if (categoryCount <= 1) {
    return candidates;
  }
  
  const results = [];
  const maxPerCategory = Math.ceil(RECOMMENDATION_CONFIG.feedSize / categoryCount) + 2;
  
  for (const categoryId in categoryGroups) {
    const group = categoryGroups[categoryId].slice(0, maxPerCategory);
    results.push(...group);
  }
  
  results.sort((a, b) => b.score - a.score);
  
  return results;
};

const generateRecommendations = async (userId, options = {}) => {
  const {
    feedSize = RECOMMENDATION_CONFIG.feedSize,
    requestId = null,
    sessionId = null,
    userIp = null,
    userAgent = null
  } = options;
  
  try {
    logger.info('开始生成推荐', { userId, feedSize });
    
    const userProfile = await getUserProfile(userId);
    const recentContentIds = await getRecentRecommendations(userId);
    
    const candidates = await getCandidateContents(userId, recentContentIds);
    
    if (candidates.length === 0) {
      logger.warn('没有候选内容可供推荐', { userId });
      return {
        recommendations: [],
        algorithmVersion: ALGORITHM_VERSION,
        feedSize: 0
      };
    }
    
    const scoredCandidates = candidates.map(content => {
      const score = calculateContentScore(content, userProfile);
      return {
        ...content.toJSON(),
        score
      };
    });
    
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    const diverseCandidates = applyDiversity(scoredCandidates, userProfile);
    
    const finalCandidates = diverseCandidates
      .filter(c => c.score >= RECOMMENDATION_CONFIG.minScore)
      .slice(0, feedSize);
    
    const recommendations = [];
    const distributionPath = [
      { step: 'start', timestamp: new Date().toISOString(), details: '推荐请求接收' },
      { step: 'profile_load', timestamp: new Date().toISOString(), details: '用户画像加载完成' },
      { step: 'candidate_fetch', timestamp: new Date().toISOString(), details: `获取${candidates.length}个候选内容` },
      { step: 'scoring', timestamp: new Date().toISOString(), details: '内容评分完成' },
      { step: 'ranking', timestamp: new Date().toISOString(), details: `最终选择${finalCandidates.length}个内容` }
    ];
    
    for (let i = 0; i < finalCandidates.length; i++) {
      const candidate = finalCandidates[i];
      const recommendationId = generateRecommendationId();
      
      const recommendation = await Recommendation.create({
        userId,
        contentId: candidate.id,
        recommendationId,
        algorithmVersion: ALGORITHM_VERSION,
        score: candidate.score,
        position: i + 1,
        distributionPath: distributionPath,
        status: 'pending',
        isDelivered: false,
        requestId,
        sessionId
      });
      
      recommendations.push({
        ...recommendation.toJSON(),
        content: {
          id: candidate.id,
          title: candidate.title,
          summary: candidate.summary,
          coverImage: candidate.coverImage,
          author: candidate.author,
          source: candidate.source,
          publishTime: candidate.publishTime,
          viewCount: candidate.viewCount,
          likeCount: candidate.likeCount,
          commentCount: candidate.commentCount,
          category: candidate.category,
          weightTags: candidate.weightTags,
          semanticTags: candidate.semanticTags
        }
      });
    }
    
    logger.info('推荐生成完成', {
      userId,
      count: recommendations.length,
      algorithmVersion: ALGORITHM_VERSION
    });
    
    return {
      recommendations,
      algorithmVersion: ALGORITHM_VERSION,
      feedSize: recommendations.length,
      distributionPath
    };
  } catch (error) {
    logger.error('推荐生成失败', error);
    throw error;
  }
};

const markRecommendationDelivered = async (recommendationId) => {
  const recommendation = await Recommendation.findOne({
    where: { recommendationId }
  });
  
  if (!recommendation) {
    throw new Error('推荐记录不存在');
  }
  
  await recommendation.update({
    status: 'delivered',
    isDelivered: true,
    deliveredAt: new Date()
  });
  
  return recommendation;
};

const markRecommendationViewed = async (recommendationId, viewDuration = 0) => {
  const recommendation = await Recommendation.findOne({
    where: { recommendationId }
  });
  
  if (!recommendation) {
    throw new Error('推荐记录不存在');
  }
  
  await recommendation.update({
    status: 'viewed',
    viewedAt: new Date(),
    viewDuration
  });
  
  const content = await Content.findByPk(recommendation.contentId);
  if (content) {
    await content.increment('viewCount');
  }
  
  return recommendation;
};

const markRecommendationClicked = async (recommendationId) => {
  const recommendation = await Recommendation.findOne({
    where: { recommendationId }
  });
  
  if (!recommendation) {
    throw new Error('推荐记录不存在');
  }
  
  await recommendation.update({
    status: 'clicked',
    clickedAt: new Date()
  });
  
  return recommendation;
};

const updateUserProfileFromInteraction = async (userId, contentId, interactionType, weight = 1.0) => {
  const profile = await getUserProfile(userId);
  const content = await Content.findByPk(contentId);
  
  if (!content) return;
  
  const interests = { ...(profile.interests || {}) };
  const categoryPreferences = { ...(profile.categoryPreferences || {}) };
  
  const contentTags = [
    ...(content.semanticTags || []),
    ...(content.keywords || [])
  ];
  
  contentTags.forEach(tag => {
    const currentWeight = interests[tag] || 0;
    let newWeight = currentWeight;
    
    switch (interactionType) {
      case 'view':
        newWeight += 0.1 * weight;
        break;
      case 'like':
        newWeight += 0.3 * weight;
        break;
      case 'comment':
        newWeight += 0.2 * weight;
        break;
      case 'share':
        newWeight += 0.25 * weight;
        break;
      case 'collect':
        newWeight += 0.2 * weight;
        break;
      default:
        newWeight += 0.05 * weight;
    }
    
    interests[tag] = Math.min(newWeight, 10);
  });
  
  if (content.categoryId) {
    const currentCategoryWeight = categoryPreferences[content.categoryId] || 0;
    categoryPreferences[content.categoryId] = Math.min(
      currentCategoryWeight + 0.1 * weight,
      10
    );
  }
  
  await profile.update({
    interests,
    categoryPreferences
  });
  
  logger.info('用户画像已更新', {
    userId,
    contentId,
    interactionType,
    tagsCount: contentTags.length
  });
};

const getRecommendationStats = async (userId, options = {}) => {
  const { startDate, endDate } = options;
  
  const where = { userId };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  }
  
  const totalRecommendations = await Recommendation.count({ where });
  const deliveredCount = await Recommendation.count({ where: { ...where, isDelivered: true } });
  const viewedCount = await Recommendation.count({ where: { ...where, status: 'viewed' } });
  const clickedCount = await Recommendation.count({ where: { ...where, status: 'clicked' } });
  
  const ctr = deliveredCount > 0 ? clickedCount / deliveredCount : 0;
  
  return {
    total: totalRecommendations,
    delivered: deliveredCount,
    viewed: viewedCount,
    clicked: clickedCount,
    ctr: parseFloat(ctr.toFixed(4)),
    deliveryRate: deliveredCount > 0 ? deliveredCount / totalRecommendations : 0,
    viewRate: deliveredCount > 0 ? viewedCount / deliveredCount : 0
  };
};

module.exports = {
  ALGORITHM_VERSION,
  RECOMMENDATION_CONFIG,
  generateRecommendationId,
  calculateContentScore,
  getUserProfile,
  getCandidateContents,
  getRecentRecommendations,
  generateRecommendations,
  markRecommendationDelivered,
  markRecommendationViewed,
  markRecommendationClicked,
  updateUserProfileFromInteraction,
  getRecommendationStats
};
