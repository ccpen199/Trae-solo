const { Op } = require('sequelize');
const { Interaction, Comment, ContentLike, ContentCollect } = require('../models');
const { Content } = require('../models');
const { User } = require('../models');
const logger = require('../utils/logger');
const { updateUserProfileFromInteraction } = require('./recommendationService');

const HOT_SCORE_CONFIG = {
  viewWeight: 1,
  likeWeight: 10,
  commentWeight: 20,
  shareWeight: 15,
  collectWeight: 8,
  timeDecayFactor: 0.0001
};

const COMMENT_FILTER_CONFIG = {
  sensitiveWords: [
    '广告', '推销', '代购', '加微信', '加v', 'vx', 'qq',
    '赚钱', '兼职', '日赚', '月薪',
    '色情', '暴力', '赌博', '毒品',
    '诈骗', '骗子', '假货', '高仿'
  ],
  minLength: 2,
  maxLength: 1000
};

const recordInteraction = async (options) => {
  const {
    userId,
    contentId,
    type,
    sessionId = null,
    requestId = null,
    recommendationId = null,
    viewDuration = 0,
    scrollDepth = 0,
    readProgress = 0,
    source = 'feed',
    userIp = null,
    userAgent = null
  } = options;
  
  try {
    const interaction = await Interaction.create({
      userId,
      contentId,
      type,
      sessionId,
      requestId,
      recommendationId,
      viewDuration,
      scrollDepth,
      readProgress,
      source,
      userIp,
      userAgent
    });
    
    const weight = type === 'like' ? 1.5 : 
                   type === 'comment' ? 1.2 :
                   type === 'share' ? 1.3 :
                   type === 'collect' ? 1.1 : 1.0;
    
    await updateUserProfileFromInteraction(userId, contentId, type, weight);
    
    await updateContentStats(contentId, type);
    
    if (type === 'view' && viewDuration > 30) {
      await calculateHotScore(contentId);
    }
    
    logger.info('互动记录已创建', {
      userId,
      contentId,
      type,
      interactionId: interaction.id
    });
    
    return interaction;
  } catch (error) {
    logger.error('记录互动失败', error);
    throw error;
  }
};

const updateContentStats = async (contentId, interactionType) => {
  const content = await Content.findByPk(contentId);
  
  if (!content) return;
  
  switch (interactionType) {
    case 'view':
      await content.increment('viewCount');
      break;
    case 'like':
      await content.increment('likeCount');
      break;
    case 'unlike':
      await content.decrement('likeCount');
      break;
    case 'comment':
      await content.increment('commentCount');
      break;
    case 'share':
      await content.increment('shareCount');
      break;
    case 'collect':
      break;
    case 'uncollect':
      break;
    default:
      break;
  }
};

const calculateHotScore = async (contentId) => {
  const content = await Content.findByPk(contentId);
  
  if (!content) return 0;
  
  const now = Date.now();
  const publishTime = new Date(content.publishTime || content.createdAt).getTime();
  const hoursSincePublish = (now - publishTime) / (1000 * 60 * 60);
  
  const timeDecay = Math.exp(-hoursSincePublish * HOT_SCORE_CONFIG.timeDecayFactor);
  
  const viewScore = content.viewCount * HOT_SCORE_CONFIG.viewWeight;
  const likeScore = content.likeCount * HOT_SCORE_CONFIG.likeWeight;
  const commentScore = content.commentCount * HOT_SCORE_CONFIG.commentWeight;
  const shareScore = content.shareCount * HOT_SCORE_CONFIG.shareWeight;
  
  const interactionScore = viewScore + likeScore + commentScore + shareScore;
  
  const hotScore = (interactionScore * timeDecay + 100) * content.recommendationWeight;
  
  await content.update({ hotScore });
  
  return hotScore;
};

const toggleLike = async (userId, contentId) => {
  const existingLike = await ContentLike.findOne({
    where: { userId, contentId, status: 'active' }
  });
  
  if (existingLike) {
    await existingLike.update({ status: 'cancelled' });
    
    await recordInteraction({
      userId,
      contentId,
      type: 'unlike'
    });
    
    return {
      liked: false,
      like: existingLike
    };
  }
  
  const newLike = await ContentLike.create({
    userId,
    contentId,
    status: 'active'
  });
  
  await recordInteraction({
    userId,
    contentId,
    type: 'like'
  });
  
  await calculateHotScore(contentId);
  
  return {
    liked: true,
    like: newLike
  };
};

const toggleCollect = async (userId, contentId, folderId = null) => {
  const existingCollect = await ContentCollect.findOne({
    where: { userId, contentId, status: 'active' }
  });
  
  if (existingCollect) {
    await existingCollect.update({ status: 'cancelled' });
    
    await recordInteraction({
      userId,
      contentId,
      type: 'uncollect'
    });
    
    return {
      collected: false,
      collect: existingCollect
    };
  }
  
  const newCollect = await ContentCollect.create({
    userId,
    contentId,
    folderId,
    status: 'active'
  });
  
  await recordInteraction({
    userId,
    contentId,
    type: 'collect'
  });
  
  return {
    collected: true,
    collect: newCollect
  };
};

const filterComment = (content) => {
  const result = {
    passed: true,
    reason: null,
    keywords: [],
    score: 1.0
  };
  
  if (!content || content.length < COMMENT_FILTER_CONFIG.minLength) {
    result.passed = false;
    result.reason = '评论内容过短';
    result.score = 0;
    return result;
  }
  
  if (content.length > COMMENT_FILTER_CONFIG.maxLength) {
    result.passed = false;
    result.reason = '评论内容过长';
    result.score = 0;
    return result;
  }
  
  const lowerContent = content.toLowerCase();
  
  for (const word of COMMENT_FILTER_CONFIG.sensitiveWords) {
    if (lowerContent.includes(word)) {
      result.keywords.push(word);
    }
  }
  
  if (result.keywords.length > 0) {
    result.passed = false;
    result.reason = '评论包含敏感内容';
    result.score = 0.3;
  }
  
  const urlPattern = /(https?:\/\/|www\.)[^\s]+/g;
  if (urlPattern.test(content)) {
    result.keywords.push('url');
    result.score *= 0.7;
  }
  
  return result;
};

const createComment = async (options) => {
  const {
    userId,
    contentId,
    parentId = null,
    replyToUserId = null,
    commentContent,
    userIp = null,
    userAgent = null
  } = options;
  
  try {
    const filterResult = filterComment(commentContent);
    
    const comment = await Comment.create({
      userId,
      contentId,
      parentId,
      replyToUserId,
      content: commentContent,
      status: filterResult.passed ? 'published' : 'pending',
      filterResult,
      likeCount: 0,
      replyCount: 0,
      isTop: false,
      isHot: false,
      hotScore: 0
    });
    
    if (filterResult.passed) {
      await recordInteraction({
        userId,
        contentId,
        type: 'comment'
      });
      
      await calculateHotScore(contentId);
    }
    
    logger.info('评论已创建', {
      commentId: comment.id,
      userId,
      contentId,
      passed: filterResult.passed
    });
    
    return {
      comment,
      filterResult
    };
  } catch (error) {
    logger.error('创建评论失败', error);
    throw error;
  }
};

const getComments = async (contentId, options = {}) => {
  const {
    page = 1,
    pageSize = 20,
    orderBy = 'createdAt',
    orderDirection = 'DESC',
    parentId = null
  } = options;
  
  const where = {
    contentId,
    status: 'published'
  };
  
  if (parentId !== undefined) {
    where.parentId = parentId;
  }
  
  const offset = (page - 1) * pageSize;
  
  const { count, rows } = await Comment.findAndCountAll({
    where,
    include: [
      {
        association: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar']
      },
      {
        association: 'replies',
        include: [
          {
            association: 'user',
            attributes: ['id', 'username', 'nickname', 'avatar']
          }
        ],
        where: { status: 'published' },
        required: false
      }
    ],
    order: [
      ['isTop', 'DESC'],
      [orderBy, orderDirection]
    ],
    limit: pageSize,
    offset,
    distinct: true
  });
  
  return {
    comments: rows,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  };
};

const getContentInteractions = async (contentId, options = {}) => {
  const {
    type,
    page = 1,
    pageSize = 20
  } = options;
  
  const where = { contentId };
  
  if (type) {
    where.type = type;
  }
  
  const offset = (page - 1) * pageSize;
  
  const { count, rows } = await Interaction.findAndCountAll({
    where,
    include: [
      {
        association: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: pageSize,
    offset
  });
  
  return {
    interactions: rows,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  };
};

const getUserInteractionStats = async (userId, options = {}) => {
  const { startDate, endDate } = options;
  
  const where = { userId };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  }
  
  const viewCount = await Interaction.count({
    where: { ...where, type: 'view' }
  });
  
  const likeCount = await Interaction.count({
    where: { ...where, type: 'like' }
  });
  
  const commentCount = await Interaction.count({
    where: { ...where, type: 'comment' }
  });
  
  const shareCount = await Interaction.count({
    where: { ...where, type: 'share' }
  });
  
  const collectCount = await Interaction.count({
    where: { ...where, type: 'collect' }
  });
  
  const totalReadTime = await Interaction.sum('viewDuration', {
    where: { ...where, type: 'view' }
  }) || 0;
  
  return {
    viewCount,
    likeCount,
    commentCount,
    shareCount,
    collectCount,
    totalReadTime,
    totalInteractions: viewCount + likeCount + commentCount + shareCount + collectCount
  };
};

module.exports = {
  HOT_SCORE_CONFIG,
  COMMENT_FILTER_CONFIG,
  recordInteraction,
  updateContentStats,
  calculateHotScore,
  toggleLike,
  toggleCollect,
  filterComment,
  createComment,
  getComments,
  getContentInteractions,
  getUserInteractionStats
};
