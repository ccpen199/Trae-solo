const express = require('express');
const { User, Article, Question, Comment, Category } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

router.use(authMiddleware, requireRole('admin', 'moderator', 'editor'));

router.get('/stats', async (req, res) => {
  try {
    const [usersCount, articlesCount, questionsCount, commentsCount] = await Promise.all([
      User.count(),
      Article.count({ where: { status: 'published' } }),
      Question.count(),
      Comment.count({ where: { status: 'active' } })
    ]);

    res.json({
      success: true,
      data: {
        usersCount,
        articlesCount,
        questionsCount,
        commentsCount
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取统计失败'
    });
  }
});

router.get('/users', requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    let where = {};
    if (status) {
      where.status = status;
    }
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
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
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

router.put('/users/:id/status', requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: '用户状态已更新'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户状态失败'
    });
  }
});

router.get('/articles', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    let where = {};
    if (status) {
      where.status = status;
    }
    if (keyword) {
      where.title = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
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
    console.error('Get admin articles error:', error);
    res.status(500).json({
      success: false,
      message: '获取文章列表失败'
    });
  }
});

router.put('/articles/:id/status', requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isFeatured } = req.body;

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    if (status !== undefined) article.status = status;
    if (isFeatured !== undefined) article.isFeatured = isFeatured;
    
    await article.save();

    res.json({
      success: true,
      message: '文章状态已更新'
    });
  } catch (error) {
    console.error('Update article status error:', error);
    res.status(500).json({
      success: false,
      message: '更新文章状态失败'
    });
  }
});

router.get('/questions', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    let where = {};
    if (status) {
      where.status = status;
    }
    if (keyword) {
      where.title = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await Question.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
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
    console.error('Get admin questions error:', error);
    res.status(500).json({
      success: false,
      message: '获取问题列表失败'
    });
  }
});

router.put('/questions/:id/status', requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isFeatured } = req.body;

    const question = await Question.findByPk(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    if (status !== undefined) question.status = status;
    if (isFeatured !== undefined) question.isFeatured = isFeatured;
    
    await question.save();

    res.json({
      success: true,
      message: '问题状态已更新'
    });
  } catch (error) {
    console.error('Update question status error:', error);
    res.status(500).json({
      success: false,
      message: '更新问题状态失败'
    });
  }
});

router.post('/categories', requireRole('admin'), async (req, res) => {
  try {
    const { name, slug, description, icon, sort } = req.body;

    const category = await Category.create({
      name,
      slug,
      description,
      icon,
      sort: sort || 0
    });

    res.json({
      success: true,
      message: '分类已创建',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败'
    });
  }
});

router.put('/categories/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, sort, status } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    if (name !== undefined) category.name = name;
    if (slug !== undefined) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (sort !== undefined) category.sort = sort;
    if (status !== undefined) category.status = status;
    
    await category.save();

    res.json({
      success: true,
      message: '分类已更新'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: '更新分类失败'
    });
  }
});

module.exports = router;
