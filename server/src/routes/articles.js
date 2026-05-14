const express = require('express');
const { body, validationResult } = require('express-validator');
const { Article, User, Category, Like, Favorite } = require('../models');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, categoryId, sort = 'latest', keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    let where = { status: 'published' };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } },
        { tags: { [Op.like]: `%${keyword}%` } }
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'hot') {
      order = [['viewsCount', 'DESC'], ['likesCount', 'DESC']];
    } else if (sort === 'featured') {
      order = [['isFeatured', 'DESC'], ['createdAt', 'DESC']];
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'avatar', 'bio']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      order,
      limit: parseInt(pageSize),
      offset
    });

    let articlesWithInteractions = rows;
    if (req.user) {
      const articleIds = rows.map(a => a.id);
      const [likes, favorites] = await Promise.all([
        Like.findAll({
          where: { userId: req.user.id, targetType: 'article', targetId: { [Op.in]: articleIds } }
        }),
        Favorite.findAll({
          where: { userId: req.user.id, targetType: 'article', targetId: { [Op.in]: articleIds } }
        })
      ]);
      
      const likedIds = new Set(likes.map(l => l.targetId));
      const favoritedIds = new Set(favorites.map(f => f.targetId));
      
      articlesWithInteractions = rows.map(article => ({
        ...article.toJSON(),
        isLiked: likedIds.has(article.id),
        isFavorited: favoritedIds.has(article.id)
      }));
    }

    res.json({
      success: true,
      data: {
        list: articlesWithInteractions,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: '获取文章列表失败'
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'avatar', 'bio', 'followersCount', 'articlesCount']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    article.viewsCount = (article.viewsCount || 0) + 1;
    await article.save({ fields: ['viewsCount'] });

    let result = article.toJSON();
    
    if (req.user) {
      const [like, favorite, follow] = await Promise.all([
        Like.findOne({ where: { userId: req.user.id, targetType: 'article', targetId: article.id } }),
        Favorite.findOne({ where: { userId: req.user.id, targetType: 'article', targetId: article.id } }),
        require('../models').Follow.findOne({ where: { followerId: req.user.id, followingId: article.authorId } })
      ]);
      
      result.isLiked = !!like;
      result.isFavorited = !!favorite;
      result.isFollowing = !!follow;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: '获取文章详情失败'
    });
  }
});

router.post('/', authMiddleware, [
  body('title').notEmpty().withMessage('请输入文章标题').isLength({ max: 200 }),
  body('content').notEmpty().withMessage('请输入文章内容')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { title, content, summary, tags, categoryId, cover, status = 'published' } = req.body;

    const article = await Article.create({
      title,
      content,
      summary: summary || content.substring(0, 200),
      tags,
      categoryId,
      cover,
      status,
      authorId: req.user.id,
      publishDate: status === 'published' ? new Date() : null
    });

    if (status === 'published') {
      const user = await User.findByPk(req.user.id);
      if (user) {
        user.articlesCount = (user.articlesCount || 0) + 1;
        await user.save();
      }
    }

    res.status(201).json({
      success: true,
      message: '文章发布成功',
      data: article
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: '发布文章失败'
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    if (article.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权编辑此文章'
      });
    }

    const { title, content, summary, tags, categoryId, cover, status } = req.body;
    
    if (title !== undefined) article.title = title;
    if (content !== undefined) {
      article.content = content;
      article.summary = summary || content.substring(0, 200);
    }
    if (tags !== undefined) article.tags = tags;
    if (categoryId !== undefined) article.categoryId = categoryId;
    if (cover !== undefined) article.cover = cover;
    if (status !== undefined) {
      article.status = status;
      if (status === 'published' && !article.publishDate) {
        article.publishDate = new Date();
      }
    }

    await article.save();

    res.json({
      success: true,
      message: '文章更新成功',
      data: article
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: '更新文章失败'
    });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    const existingLike = await Like.findOne({
      where: { userId: req.user.id, targetType: 'article', targetId: id }
    });

    let isLiked = false;
    if (existingLike) {
      await existingLike.destroy();
      article.likesCount = Math.max(0, (article.likesCount || 0) - 1);
    } else {
      await Like.create({ userId: req.user.id, targetType: 'article', targetId: id });
      article.likesCount = (article.likesCount || 0) + 1;
      isLiked = true;
      
      await createNotification({
        userId: article.authorId,
        type: 'like',
        actorId: req.user.id,
        data: { articleId: id, articleTitle: article.title },
        link: `/article/${id}`
      });
    }

    await article.save();

    res.json({
      success: true,
      data: { isLiked, likesCount: article.likesCount }
    });
  } catch (error) {
    console.error('Like article error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    const existingFavorite = await Favorite.findOne({
      where: { userId: req.user.id, targetType: 'article', targetId: id }
    });

    let isFavorited = false;
    if (existingFavorite) {
      await existingFavorite.destroy();
      article.favoritesCount = Math.max(0, (article.favoritesCount || 0) - 1);
    } else {
      await Favorite.create({ userId: req.user.id, targetType: 'article', targetId: id });
      article.favoritesCount = (article.favoritesCount || 0) + 1;
      isFavorited = true;
      
      await createNotification({
        userId: article.authorId,
        type: 'favorite',
        actorId: req.user.id,
        data: { articleId: id, articleTitle: article.title },
        link: `/article/${id}`
      });
    }

    await article.save();

    res.json({
      success: true,
      data: { isFavorited, favoritesCount: article.favoritesCount }
    });
  } catch (error) {
    console.error('Favorite article error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

module.exports = router;
