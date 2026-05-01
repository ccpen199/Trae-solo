const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const interactionService = require('../services/interactionService');
const { Comment, ContentLike, ContentCollect } = require('../models');

router.post('/like', authenticate, async (req, res, next) => {
  try {
    const { contentId } = req.body;
    
    if (!contentId) {
      throw new AppError('内容ID不能为空', 400);
    }
    
    const result = await interactionService.toggleLike(req.user.id, contentId);
    
    res.json({
      success: true,
      message: result.liked ? '点赞成功' : '取消点赞成功',
      data: {
        liked: result.liked
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/collect', authenticate, async (req, res, next) => {
  try {
    const { contentId, folderId } = req.body;
    
    if (!contentId) {
      throw new AppError('内容ID不能为空', 400);
    }
    
    const result = await interactionService.toggleCollect(req.user.id, contentId, folderId);
    
    res.json({
      success: true,
      message: result.collected ? '收藏成功' : '取消收藏成功',
      data: {
        collected: result.collected
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/comment', authenticate, async (req, res, next) => {
  try {
    const { contentId, parentId, replyToUserId, content } = req.body;
    
    if (!contentId || !content) {
      throw new AppError('内容ID和评论内容不能为空', 400);
    }
    
    const result = await interactionService.createComment({
      userId: req.user.id,
      contentId,
      parentId,
      replyToUserId,
      commentContent: content,
      userIp: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    
    res.status(201).json({
      success: true,
      message: result.filterResult.passed ? '评论发布成功' : '评论已提交，等待审核',
      data: {
        comment: result.comment,
        filterResult: result.filterResult
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/comments/:contentId', optionalAuth, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { page = 1, pageSize = 20, orderBy = 'createdAt', orderDirection = 'DESC', parentId } = req.query;
    
    const result = await interactionService.getComments(contentId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      orderBy,
      orderDirection,
      parentId: parentId === 'null' ? null : parentId
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/comment/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const comment = await Comment.findByPk(id);
    
    if (!comment) {
      throw new AppError('评论不存在', 404);
    }
    
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('没有权限删除此评论', 403);
    }
    
    await comment.update({ status: 'deleted' });
    
    res.json({
      success: true,
      message: '评论已删除'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/comment/like', authenticate, async (req, res, next) => {
  try {
    const { commentId } = req.body;
    
    if (!commentId) {
      throw new AppError('评论ID不能为空', 400);
    }
    
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      throw new AppError('评论不存在', 404);
    }
    
    await comment.increment('likeCount');
    
    res.json({
      success: true,
      message: '评论点赞成功'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/share', authenticate, async (req, res, next) => {
  try {
    const { contentId, platform } = req.body;
    
    if (!contentId) {
      throw new AppError('内容ID不能为空', 400);
    }
    
    const sessionId = req.headers['x-session-id'] || null;
    
    await interactionService.recordInteraction({
      userId: req.user.id,
      contentId,
      type: 'share',
      sessionId,
      source: platform || 'other',
      userIp: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: '分享记录已保存'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/my/likes', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    const { count, rows } = await ContentLike.findAndCountAll({
      where: {
        userId: req.user.id,
        status: 'active'
      },
      include: [
        {
          association: 'content',
          attributes: ['id', 'title', 'summary', 'coverImage', 'author', 'source', 'publishTime', 'viewCount', 'likeCount', 'commentCount']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });
    
    res.json({
      success: true,
      data: {
        likes: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/my/collects', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    const { count, rows } = await ContentCollect.findAndCountAll({
      where: {
        userId: req.user.id,
        status: 'active'
      },
      include: [
        {
          association: 'content',
          attributes: ['id', 'title', 'summary', 'coverImage', 'author', 'source', 'publishTime', 'viewCount', 'likeCount', 'commentCount']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });
    
    res.json({
      success: true,
      data: {
        collects: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/my/comments', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    const { count, rows } = await Comment.findAndCountAll({
      where: {
        userId: req.user.id,
        status: { $not: 'deleted' }
      },
      include: [
        {
          association: 'content',
          attributes: ['id', 'title', 'coverImage']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });
    
    res.json({
      success: true,
      data: {
        comments: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await interactionService.getUserInteractionStats(req.user.id, {
      startDate,
      endDate
    });
    
    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
