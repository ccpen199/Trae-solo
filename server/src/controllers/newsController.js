const { Op } = require('sequelize');
const { News, NewsCategory } = require('../models');

const getNews = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, categoryId, isTop, isRecommended, isHot, sort } = req.query;
    
    const where = { status: 'published' };
    
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { subtitle: { [Op.like]: `%${keyword}%` } },
        { summary: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } },
        { keywords: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (categoryId) {
      where.category_id = categoryId;
    }
    
    if (isTop === 'true') {
      where.is_top = true;
    }
    
    if (isRecommended === 'true') {
      where.is_recommended = true;
    }
    
    if (isHot === 'true') {
      where.is_hot = true;
    }
    
    let order = [
      ['is_top', 'DESC'],
      ['sort', 'ASC'],
      ['publish_at', 'DESC'],
      ['created_at', 'DESC']
    ];
    
    if (sort === 'newest') {
      order = [['publish_at', 'DESC'], ['created_at', 'DESC']];
    } else if (sort === 'hot') {
      order = [['view_count', 'DESC']];
    }
    
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const { count, rows } = await News.findAndCountAll({
      where,
      include: [{ model: NewsCategory, as: 'category', attributes: ['id', 'name'] }],
      order,
      offset,
      limit
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
    console.error('获取新闻列表错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const news = await News.findByPk(id, {
      include: [{ model: NewsCategory, as: 'category', attributes: ['id', 'name'] }]
    });
    
    if (!news || news.status !== 'published') {
      return res.status(404).json({ success: false, message: '新闻不存在' });
    }
    
    await news.increment('view_count');
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('获取新闻详情错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const getRecommendedNews = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const news = await News.findAll({
      where: {
        status: 'published',
        is_recommended: true
      },
      include: [{ model: NewsCategory, as: 'category', attributes: ['id', 'name'] }],
      order: [
        ['is_top', 'DESC'],
        ['sort', 'ASC'],
        ['publish_at', 'DESC']
      ],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('获取推荐新闻错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const getLatestNews = async (req, res) => {
  try {
    const { limit = 10, categoryId } = req.query;
    
    const where = { status: 'published' };
    if (categoryId) {
      where.category_id = categoryId;
    }
    
    const news = await News.findAll({
      where,
      include: [{ model: NewsCategory, as: 'category', attributes: ['id', 'name'] }],
      order: [['publish_at', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('获取最新新闻错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const getCategories = async (req, res) => {
  try {
    const { parentId } = req.query;
    
    const where = { status: 'active' };
    if (parentId) {
      where.parent_id = parentId;
    } else {
      where.parent_id = { [Op.is]: null };
    }
    
    const categories = await NewsCategory.findAll({
      where,
      include: [{ model: NewsCategory, as: 'children' }],
      order: [['sort', 'ASC']]
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取新闻分类错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await NewsCategory.findAll({
      where: { status: 'active' },
      order: [['sort', 'ASC']]
    });
    
    const buildTree = (parentId = null) => {
      return categories
        .filter(cat => (parentId === null ? !cat.parent_id : cat.parent_id === parentId))
        .map(cat => ({
          ...cat.toJSON(),
          children: buildTree(cat.id)
        }));
    };
    
    const categoryTree = buildTree();
    
    res.json({
      success: true,
      data: categoryTree
    });
  } catch (error) {
    console.error('获取所有新闻分类错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const createNews = async (req, res) => {
  try {
    const {
      title, subtitle, categoryId, summary, content, coverImage,
      author, source, keywords, isTop, isRecommended, isHot, sort, status
    } = req.body;
    
    const news = await News.create({
      title,
      subtitle,
      category_id: categoryId,
      summary,
      content,
      cover_image: coverImage,
      author,
      source,
      keywords,
      is_top: isTop,
      is_recommended: isRecommended,
      is_hot: isHot,
      sort: sort || 0,
      status: status || 'draft',
      publish_at: status === 'published' ? new Date() : null
    });
    
    res.status(201).json({
      success: true,
      message: '新闻创建成功',
      data: news
    });
  } catch (error) {
    console.error('创建新闻错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, subtitle, categoryId, summary, content, coverImage,
      author, source, keywords, isTop, isRecommended, isHot, sort, status
    } = req.body;
    
    const news = await News.findByPk(id);
    
    if (!news) {
      return res.status(404).json({ success: false, message: '新闻不存在' });
    }
    
    await news.update({
      title,
      subtitle,
      category_id: categoryId,
      summary,
      content,
      cover_image: coverImage,
      author,
      source,
      keywords,
      is_top: isTop,
      is_recommended: isRecommended,
      is_hot: isHot,
      sort,
      status,
      publish_at: status === 'published' && !news.publish_at ? new Date() : news.publish_at
    });
    
    res.json({
      success: true,
      message: '新闻更新成功',
      data: news
    });
  } catch (error) {
    console.error('更新新闻错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    
    const news = await News.findByPk(id);
    
    if (!news) {
      return res.status(404).json({ success: false, message: '新闻不存在' });
    }
    
    await news.destroy();
    
    res.json({
      success: true,
      message: '新闻删除成功'
    });
  } catch (error) {
    console.error('删除新闻错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

module.exports = {
  getNews,
  getNewsById,
  getRecommendedNews,
  getLatestNews,
  getCategories,
  getAllCategories,
  createNews,
  updateNews,
  deleteNews
};