const express = require('express');
const { body, validationResult } = require('express-validator');
const { Comment, User, Like } = require('../models');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { targetType, targetId, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const { count, rows } = await Comment.findAndCountAll({
      where: { targetType, targetId, parentId: null, status: 'active' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });

    let commentsWithInteractions = rows;
    if (req.user) {
      const commentIds = rows.map(c => c.id);
      const likes = await Like.findAll({
        where: { userId: req.user.id, targetType: 'comment', targetId: { [Op.in]: commentIds } }
      });
      
      const likedIds = new Set(likes.map(l => l.targetId));
      
      commentsWithInteractions = rows.map(comment => ({
        ...comment.toJSON(),
        isLiked: likedIds.has(comment.id)
      }));
    }

    res.json({
      success: true,
      data: {
        list: commentsWithInteractions,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: '获取评论列表失败'
    });
  }
});

router.post('/', authMiddleware, [
  body('content').notEmpty().withMessage('请输入评论内容'),
  body('targetType').isIn(['article', 'question', 'answer']).withMessage('无效的目标类型'),
  body('targetId').notEmpty().withMessage('缺少目标ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { content, targetType, targetId, parentId } = req.body;

    const comment = await Comment.create({
      content,
      targetType,
      targetId,
      parentId,
      userId: req.user.id
    });

    await createNotification({
      userId: null,
      type: 'comment',
      actorId: req.user.id,
      data: { targetType, targetId, commentId: comment.id },
      link: targetType === 'article' ? `/article/${targetId}` : `/question/${targetId}`
    });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar'] }]
    });

    res.status(201).json({
      success: true,
      message: '评论发布成功',
      data: commentWithUser
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: '发布评论失败'
    });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    const existingLike = await Like.findOne({
      where: { userId: req.user.id, targetType: 'comment', targetId: id }
    });

    let isLiked = false;
    if (existingLike) {
      await existingLike.destroy();
      comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
    } else {
      await Like.create({ userId: req.user.id, targetType: 'comment', targetId: id });
      comment.likesCount = (comment.likesCount || 0) + 1;
      isLiked = true;
    }

    await comment.save();

    res.json({
      success: true,
      data: { isLiked, likesCount: comment.likesCount }
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此评论'
      });
    }

    comment.status = 'deleted';
    await comment.save();

    res.json({
      success: true,
      message: '评论已删除'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: '删除评论失败'
    });
  }
});

module.exports = router;
