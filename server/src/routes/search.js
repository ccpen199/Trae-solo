const express = require('express');
const { Article, Question, User, Category } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q, type = 'all', page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        data: {
          articles: { list: [], total: 0 },
          questions: { list: [], total: 0 },
          users: { list: [], total: 0 }
        }
      });
    }

    const keyword = `%${q.trim()}%`;
    const result = {};

    if (type === 'all' || type === 'article') {
      const { count, rows } = await Article.findAndCountAll({
        where: {
          status: 'published',
          [Op.or]: [
            { title: { [Op.like]: keyword } },
            { content: { [Op.like]: keyword } },
            { tags: { [Op.like]: keyword } }
          ]
        },
        include: [
          { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] },
          { model: Category, as: 'category', attributes: ['id', 'name'] }
        ],
        order: [['isFeatured', 'DESC'], ['viewsCount', 'DESC']],
        limit: parseInt(pageSize),
        offset
      });
      result.articles = { list: rows, total: count };
    }

    if (type === 'all' || type === 'question') {
      const { count, rows } = await Question.findAndCountAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: keyword } },
            { content: { [Op.like]: keyword } },
            { tags: { [Op.like]: keyword } }
          ]
        },
        include: [
          { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] },
          { model: Category, as: 'category', attributes: ['id', 'name'] }
        ],
        order: [['isFeatured', 'DESC'], ['viewsCount', 'DESC']],
        limit: parseInt(pageSize),
        offset
      });
      result.questions = { list: rows, total: count };
    }

    if (type === 'all' || type === 'user') {
      const { count, rows } = await User.findAndCountAll({
        where: {
          status: 'active',
          [Op.or]: [
            { username: { [Op.like]: keyword } },
            { nickname: { [Op.like]: keyword } },
            { bio: { [Op.like]: keyword } }
          ]
        },
        attributes: ['id', 'username', 'nickname', 'avatar', 'bio', 'followersCount', 'articlesCount'],
        order: [['followersCount', 'DESC']],
        limit: parseInt(pageSize),
        offset
      });
      result.users = { list: rows, total: count };
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败'
    });
  }
});

module.exports = router;
