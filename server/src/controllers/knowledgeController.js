const { Op } = require('sequelize');
const { Knowledge } = require('../models');
const { setCache, getCache, deleteCache } = require('../config/redis');

const getKnowledgeList = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category,
      keyword,
      isRecommended,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const cacheKey = `knowledge:${page}:${pageSize}:${category || 'all'}:${keyword || ''}:${isRecommended || 'false'}:${sortBy}:${sortOrder}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    const offset = (page - 1) * pageSize;
    const where = { status: 'published' };

    if (category) {
      where.category = category;
    }
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { summary: { [Op.iLike]: `%${keyword}%` } },
        { content: { [Op.iLike]: `%${keyword}%` } }
      ];
    }
    if (isRecommended === 'true') {
      where.isRecommended = true;
    }

    const { count, rows } = await Knowledge.findAndCountAll({
      where,
      order: [
        ['sortOrder', 'ASC'],
        [sortBy, sortOrder]
      ],
      limit: parseInt(pageSize),
      offset: parseInt(offset),
      attributes: { exclude: ['content'] }
    });

    const result = {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };

    await setCache(cacheKey, result, 600);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取知识列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getKnowledgeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `knowledge:${id}`;
    const cachedKnowledge = await getCache(cacheKey);

    let knowledge;
    if (cachedKnowledge) {
      knowledge = cachedKnowledge;
    } else {
      knowledge = await Knowledge.findOne({
        where: { id, status: 'published' }
      });

      if (!knowledge) {
        return res.status(404).json({
          success: false,
          message: '知识文章不存在'
        });
      }

      await setCache(cacheKey, knowledge.toJSON(), 1800);
    }

    await Knowledge.increment('viewCount', { where: { id } });

    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    console.error('获取知识详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getRecommendedKnowledge = async (req, res) => {
  try {
    const { limit = 10, category } = req.query;

    const where = { 
      status: 'published',
      isRecommended: true
    };

    if (category) {
      where.category = category;
    }

    const knowledge = await Knowledge.findAll({
      where,
      order: [
        ['sortOrder', 'ASC'],
        ['viewCount', 'DESC']
      ],
      limit: parseInt(limit),
      attributes: { exclude: ['content'] }
    });

    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    console.error('获取推荐知识错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getHotKnowledge = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const knowledge = await Knowledge.findAll({
      where: { status: 'published' },
      order: [
        ['viewCount', 'DESC'],
        ['likeCount', 'DESC']
      ],
      limit: parseInt(limit),
      attributes: { exclude: ['content'] }
    });

    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    console.error('获取热门知识错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const searchKnowledge = async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }

    const offset = (page - 1) * pageSize;

    const { count, rows } = await Knowledge.findAndCountAll({
      where: {
        status: 'published',
        [Op.or]: [
          { title: { [Op.iLike]: `%${keyword}%` } },
          { summary: { [Op.iLike]: `%${keyword}%` } },
          { tags: { [Op.contains]: [keyword] } }
        ]
      },
      order: [['viewCount', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset),
      attributes: { exclude: ['content'] }
    });

    res.json({
      success: true,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('搜索知识错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'pregnancy', label: '孕期知识', icon: 'pregnancy' },
      { value: 'preparing', label: '备孕知识', icon: 'preparing' },
      { value: 'parenting', label: '育儿知识', icon: 'parenting' },
      { value: 'health', label: '健康护理', icon: 'health' },
      { value: 'diet', label: '饮食营养', icon: 'diet' },
      { value: 'emotion', label: '心理情绪', icon: 'emotion' },
      { value: 'medical', label: '医疗资讯', icon: 'medical' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = {
  getKnowledgeList,
  getKnowledgeDetail,
  getRecommendedKnowledge,
  getHotKnowledge,
  searchKnowledge,
  getCategories
};
