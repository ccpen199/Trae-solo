const express = require('express');
const { body, validationResult } = require('express-validator');
const { Question, User, Category, Like, Favorite, Answer, Follow } = require('../models');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, categoryId, sort = 'latest', keyword, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    let where = {};
    if (status) {
      where.status = status;
    }
    
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
      order = [['viewsCount', 'DESC'], ['answersCount', 'DESC']];
    } else if (sort === 'featured') {
      order = [['isFeatured', 'DESC'], ['createdAt', 'DESC']];
    } else if (sort === 'unanswered') {
      where.answersCount = 0;
    }

    const { count, rows } = await Question.findAndCountAll({
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

    let questionsWithInteractions = rows;
    if (req.user) {
      const questionIds = rows.map(q => q.id);
      const [likes, favorites] = await Promise.all([
        Like.findAll({
          where: { userId: req.user.id, targetType: 'question', targetId: { [Op.in]: questionIds } }
        }),
        Favorite.findAll({
          where: { userId: req.user.id, targetType: 'question', targetId: { [Op.in]: questionIds } }
        })
      ]);
      
      const likedIds = new Set(likes.map(l => l.targetId));
      const favoritedIds = new Set(favorites.map(f => f.targetId));
      
      questionsWithInteractions = rows.map(question => ({
        ...question.toJSON(),
        isLiked: likedIds.has(question.id),
        isFavorited: favoritedIds.has(question.id)
      }));
    }

    res.json({
      success: true,
      data: {
        list: questionsWithInteractions,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: '获取问题列表失败'
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const question = await Question.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'avatar', 'bio', 'followersCount', 'questionsCount']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    question.viewsCount = (question.viewsCount || 0) + 1;
    await question.save({ fields: ['viewsCount'] });

    let result = question.toJSON();
    
    if (req.user) {
      const [like, favorite, follow] = await Promise.all([
        Like.findOne({ where: { userId: req.user.id, targetType: 'question', targetId: question.id } }),
        Favorite.findOne({ where: { userId: req.user.id, targetType: 'question', targetId: question.id } }),
        Follow.findOne({ where: { followerId: req.user.id, followingId: question.authorId } })
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
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: '获取问题详情失败'
    });
  }
});

router.post('/', authMiddleware, [
  body('title').notEmpty().withMessage('请输入问题标题').isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { title, content, tags, categoryId } = req.body;

    const question = await Question.create({
      title,
      content,
      tags,
      categoryId,
      authorId: req.user.id
    });

    const user = await User.findByPk(req.user.id);
    if (user) {
      user.questionsCount = (user.questionsCount || 0) + 1;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: '问题发布成功',
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: '发布问题失败'
    });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    const existingLike = await Like.findOne({
      where: { userId: req.user.id, targetType: 'question', targetId: id }
    });

    let isLiked = false;
    if (existingLike) {
      await existingLike.destroy();
      question.likesCount = Math.max(0, (question.likesCount || 0) - 1);
    } else {
      await Like.create({ userId: req.user.id, targetType: 'question', targetId: id });
      question.likesCount = (question.likesCount || 0) + 1;
      isLiked = true;
      
      await createNotification({
        userId: question.authorId,
        type: 'like',
        actorId: req.user.id,
        data: { questionId: id, questionTitle: question.title },
        link: `/question/${id}`
      });
    }

    await question.save();

    res.json({
      success: true,
      data: { isLiked, likesCount: question.likesCount }
    });
  } catch (error) {
    console.error('Like question error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    const existingFavorite = await Favorite.findOne({
      where: { userId: req.user.id, targetType: 'question', targetId: id }
    });

    let isFavorited = false;
    if (existingFavorite) {
      await existingFavorite.destroy();
      question.favoritesCount = Math.max(0, (question.favoritesCount || 0) - 1);
    } else {
      await Favorite.create({ userId: req.user.id, targetType: 'question', targetId: id });
      question.favoritesCount = (question.favoritesCount || 0) + 1;
      isFavorited = true;
      
      await createNotification({
        userId: question.authorId,
        type: 'favorite',
        actorId: req.user.id,
        data: { questionId: id, questionTitle: question.title },
        link: `/question/${id}`
      });
    }

    await question.save();

    res.json({
      success: true,
      data: { isFavorited, favoritesCount: question.favoritesCount }
    });
  } catch (error) {
    console.error('Favorite question error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.get('/:id/answers', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Answer.findAndCountAll({
      where: { questionId: id, status: 'active' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'avatar', 'bio']
        }
      ],
      order: [['isAccepted', 'DESC'], ['likesCount', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });

    let answersWithInteractions = rows;
    if (req.user) {
      const answerIds = rows.map(a => a.id);
      const likes = await Like.findAll({
        where: { userId: req.user.id, targetType: 'answer', targetId: { [Op.in]: answerIds } }
      });
      
      const likedIds = new Set(likes.map(l => l.targetId));
      
      answersWithInteractions = rows.map(answer => ({
        ...answer.toJSON(),
        isLiked: likedIds.has(answer.id)
      }));
    }

    res.json({
      success: true,
      data: {
        list: answersWithInteractions,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('Get answers error:', error);
    res.status(500).json({
      success: false,
      message: '获取回答列表失败'
    });
  }
});

router.post('/:id/answers', authMiddleware, [
  body('content').notEmpty().withMessage('请输入回答内容')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { id } = req.params;
    const { content } = req.body;

    const question = await Question.findByPk(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    const answer = await Answer.create({
      content,
      questionId: id,
      authorId: req.user.id
    });

    question.answersCount = (question.answersCount || 0) + 1;
    await question.save();

    await createNotification({
      userId: question.authorId,
      type: 'answer',
      actorId: req.user.id,
      data: { questionId: id, questionTitle: question.title, answerId: answer.id },
      link: `/question/${id}`
    });

    res.status(201).json({
      success: true,
      message: '回答发布成功',
      data: answer
    });
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({
      success: false,
      message: '发布回答失败'
    });
  }
});

module.exports = router;
