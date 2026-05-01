const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { Content, Category, WeightTag } = require('../models');
const logger = require('../utils/logger');
const { trackContentChange } = require('../utils/audit');
const { redisClient } = require('../config/redis');

const CATEGORY_KEYWORDS = {
  科技: ['科技', '技术', 'AI', '人工智能', '互联网', 'IT', '软件', '硬件', '芯片', '算法', '大数据', '云计算', '5G', '区块链', '元宇宙', 'VR', 'AR'],
  财经: ['财经', '金融', '股票', '基金', '投资', '理财', '银行', '保险', '证券', '期货', '外汇', '经济', '贸易', 'GDP', '通胀', '利率'],
  体育: ['体育', '足球', '篮球', 'NBA', '世界杯', '奥运会', '运动', '健身', '跑步', '游泳', '网球', '羽毛球', '高尔夫', '赛事', '冠军', '球员'],
  娱乐: ['娱乐', '明星', '电影', '电视剧', '综艺', '音乐', '歌手', '演员', '导演', '娱乐圈', '八卦', '演唱会', '颁奖典礼'],
  健康: ['健康', '医疗', '医院', '医生', '疾病', '药品', '疫苗', '养生', '健身', '营养', '减肥', '心理', '中医', '西医'],
  教育: ['教育', '学校', '学生', '老师', '大学', '高考', '考研', '留学', '培训', '课程', '学习', '考试', '毕业', '就业'],
  美食: ['美食', '餐饮', '餐厅', '菜谱', '烹饪', '食材', '酒店', '外卖', '小吃', '零食', '饮料', '咖啡', '甜点'],
  旅游: ['旅游', '旅行', '酒店', '机票', '景点', '景区', '度假', '民宿', '攻略', '签证', '出境', '自驾游', '跟团游'],
  汽车: ['汽车', '车辆', '新能源', '电动车', '特斯拉', '奔驰', '宝马', '奥迪', 'SUV', '轿车', '跑车', '车展', '驾照', '二手车'],
  房产: ['房产', '房地产', '房价', '楼市', '买房', '卖房', '租房', '中介', '楼盘', '小区', '装修', '房贷', '公积金']
};

const SEMANTIC_ANALYSIS_CONFIG = {
  keywordWeight: 0.6,
  titleWeight: 0.3,
  contentWeight: 0.1,
  minKeywordLength: 2,
  maxKeywords: 20
};

const generateContentHash = (title, content) => {
  const hashInput = `${title}|${content.substring(0, 1000)}`;
  return crypto.createHash('sha256').update(hashInput, 'utf8').digest('hex');
};

const extractKeywords = (text, maxCount = 10) => {
  if (!text) return [];
  
  const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');
  const words = cleanText.split(/\s+/).filter(w => w.length >= SEMANTIC_ANALYSIS_CONFIG.minKeywordLength);
  
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  const sortedWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([word]) => word);
  
  return sortedWords;
};

const analyzeCategory = (title, content, keywords = []) => {
  const text = `${title} ${content}`.toLowerCase();
  const categoryScores = {};
  
  for (const [category, categoryKeywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    categoryKeywords.forEach(kw => {
      const regex = new RegExp(kw.toLowerCase(), 'g');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    
    if (score > 0) {
      categoryScores[category] = score;
    }
  }
  
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1]);
  
  if (sortedCategories.length === 0) {
    return {
      primaryCategory: null,
      categoryTags: [],
      scores: {}
    };
  }
  
  return {
    primaryCategory: sortedCategories[0][0],
    categoryTags: sortedCategories.map(([cat]) => cat),
    scores: categoryScores
  };
};

const analyzeSemanticTags = (title, content, keywords = []) => {
  const allKeywords = [
    ...keywords,
    ...extractKeywords(title, 5),
    ...extractKeywords(content, 10)
  ];
  
  const uniqueTags = [...new Set(allTags)];
  
  const scoredTags = uniqueTags.map(tag => {
    const titleMatch = title.includes(tag) ? 2 : 0;
    const contentMatch = (content.match(new RegExp(tag, 'g')) || []).length;
    return {
      tag,
      score: titleMatch + contentMatch * 0.5
    };
  });
  
  return scoredTags
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(t => t.tag);
};

const checkDuplicate = async (contentHash, contentId = null) => {
  const whereClause = {
    contentHash,
    isDuplicate: false
  };
  
  if (contentId) {
    whereClause.id = { [Symbol.for('ne')]: contentId };
  }
  
  const duplicates = await Content.findAll({
    where: whereClause,
    attributes: ['id', 'title', 'createdAt'],
    limit: 5
  });
  
  return {
    isDuplicate: duplicates.length > 0,
    originalContent: duplicates[0] || null,
    similarContents: duplicates
  };
};

const importContent = async (contentData, userId) => {
  try {
    const { title, content, source, sourceUrl, coverImage, author } = contentData;
    
    if (!title || !content) {
      throw new Error('标题和内容不能为空');
    }
    
    const contentHash = generateContentHash(title, content);
    const keywords = extractKeywords(`${title} ${content}`, 15);
    
    const categoryAnalysis = analyzeCategory(title, content, keywords);
    const semanticTags = analyzeSemanticTags(title, content, keywords);
    
    const duplicateCheck = await checkDuplicate(contentHash);
    
    const newContent = await Content.create({
      title,
      summary: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      content,
      source,
      sourceUrl,
      coverImage,
      author,
      status: 'pending_analysis',
      contentHash,
      keywords,
      semanticTags,
      categoryTags: categoryAnalysis.categoryTags,
      isDuplicate: duplicateCheck.isDuplicate,
      originalContentId: duplicateCheck.originalContent?.id,
      createdBy: userId
    });
    
    logger.info('内容入库成功', {
      contentId: newContent.id,
      title: newContent.title,
      isDuplicate: duplicateCheck.isDuplicate
    });
    
    await trackContentChange(userId, '内容入库', null, newContent.toJSON());
    
    return {
      content: newContent,
      analysis: {
        keywords,
        semanticTags,
        categoryTags: categoryAnalysis.categoryTags,
        primaryCategory: categoryAnalysis.primaryCategory
      },
      duplicateCheck
    };
  } catch (error) {
    logger.error('内容入库失败', error);
    throw error;
  }
};

const analyzeContent = async (contentId) => {
  try {
    const content = await Content.findByPk(contentId);
    
    if (!content) {
      throw new Error('内容不存在');
    }
    
    await content.update({ status: 'analyzing' });
    
    const keywords = extractKeywords(`${content.title} ${content.content}`, 15);
    const categoryAnalysis = analyzeCategory(content.title, content.content, keywords);
    const semanticTags = analyzeSemanticTags(content.title, content.content, keywords);
    
    let categoryId = null;
    if (categoryAnalysis.primaryCategory) {
      const category = await Category.findOne({
        where: { name: categoryAnalysis.primaryCategory }
      });
      categoryId = category?.id;
    }
    
    const duplicateCheck = await checkDuplicate(content.contentHash, contentId);
    
    await content.update({
      status: 'to_recommend',
      keywords,
      semanticTags,
      categoryTags: categoryAnalysis.categoryTags,
      categoryId,
      isDuplicate: duplicateCheck.isDuplicate,
      originalContentId: duplicateCheck.originalContent?.id
    });
    
    logger.info('内容分析完成', {
      contentId,
      semanticTags,
      categoryTags: categoryAnalysis.categoryTags,
      isDuplicate: duplicateCheck.isDuplicate
    });
    
    return {
      content: content.toJSON(),
      analysis: {
        keywords,
        semanticTags,
        categoryTags: categoryAnalysis.categoryTags,
        primaryCategory: categoryAnalysis.primaryCategory
      },
      duplicateCheck
    };
  } catch (error) {
    logger.error('内容分析失败', error);
    throw error;
  }
};

const setWeightTags = async (contentId, weightTagIds, operatorId) => {
  try {
    const content = await Content.findByPk(contentId);
    
    if (!content) {
      throw new Error('内容不存在');
    }
    
    const beforeData = content.toJSON();
    
    const weightTags = await WeightTag.findAll({
      where: { id: weightTagIds, status: 'active' }
    });
    
    let recommendationWeight = 1.0;
    weightTags.forEach(tag => {
      recommendationWeight *= tag.weightValue;
    });
    
    await content.update({
      weightTags: weightTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        code: tag.code,
        weightValue: tag.weightValue
      })),
      recommendationWeight
    });
    
    await trackContentChange(operatorId, '设置权重标签', beforeData, content.toJSON());
    
    logger.info('权重标签设置成功', {
      contentId,
      weightTagIds,
      recommendationWeight
    });
    
    return content;
  } catch (error) {
    logger.error('设置权重标签失败', error);
    throw error;
  }
};

const publishContent = async (contentId, operatorId) => {
  try {
    const content = await Content.findByPk(contentId);
    
    if (!content) {
      throw new Error('内容不存在');
    }
    
    if (content.isDuplicate) {
      throw new Error('重复内容不能发布');
    }
    
    const beforeData = content.toJSON();
    
    await content.update({
      status: 'published',
      publishTime: new Date()
    });
    
    await trackContentChange(operatorId, '内容发布', beforeData, content.toJSON());
    
    logger.info('内容发布成功', { contentId });
    
    return content;
  } catch (error) {
    logger.error('内容发布失败', error);
    throw error;
  }
};

const listContents = async (options = {}) => {
  const {
    status,
    categoryId,
    keyword,
    page = 1,
    pageSize = 20,
    orderBy = 'createdAt',
    orderDirection = 'DESC'
  } = options;
  
  const where = {};
  
  if (status) {
    where.status = status;
  }
  
  if (categoryId) {
    where.categoryId = categoryId;
  }
  
  const offset = (page - 1) * pageSize;
  
  const { count, rows } = await Content.findAndCountAll({
    where,
    include: [
      { association: 'category', attributes: ['id', 'name'] },
      { association: 'creator', attributes: ['id', 'username', 'nickname'] }
    ],
    order: [[orderBy, orderDirection]],
    limit: pageSize,
    offset,
    distinct: true
  });
  
  return {
    contents: rows,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  };
};

module.exports = {
  generateContentHash,
  extractKeywords,
  analyzeCategory,
  analyzeSemanticTags,
  checkDuplicate,
  importContent,
  analyzeContent,
  setWeightTags,
  publishContent,
  listContents,
  CATEGORY_KEYWORDS
};
