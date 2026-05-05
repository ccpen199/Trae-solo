const { Op } = require('sequelize');
const { Comment, CommentLike } = require('../models/Comment');
const { Package } = require('../models/Package');
const User = require('../models/User');
const { cache } = require('../config/redis');

const commentController = {
  
  createComment: async (req, res) => {
    try {
      const userId = req.userId;
      const { packageId, orderId, content, rating = 5, images, tags, isAnonymous = false, selectedAttributes, houseArea, totalPrice } = req.body;

      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: '请选择套餐'
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '评论内容不能为空'
        });
      }

      const pkg = await Package.findByPk(packageId);
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: '套餐不存在'
        });
      }

      const comment = await Comment.create({
        userId,
        packageId,
        orderId,
        content: content.trim(),
        rating: Math.min(5, Math.max(1, parseInt(rating) || 5)),
        images,
        tags,
        isAnonymous,
        selectedAttributes,
        houseArea: houseArea ? parseFloat(houseArea) : null,
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        status: 1
      });

      const comments = await Comment.findAll({
        where: { packageId, status: 1 }
      });

      const totalRating = comments.reduce((sum, c) => sum + (c.rating || 0), 0);
      const avgRating = comments.length > 0 ? totalRating / comments.length : 5;

      await pkg.update({
        rating: Math.round(avgRating * 100) / 100,
        reviewCount: comments.length
      });

      await cache.del(`comments:${packageId}:*`);

      res.json({
        success: true,
        message: '评论发表成功',
        data: {
          commentId: comment.id,
          rating: comment.rating
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '发表评论失败',
        error: error.message
      });
    }
  },

  getCommentList: async (req, res) => {
    try {
      const { packageId } = req.params;
      const { rating, page = 1, pageSize = 20, sort = 'new' } = req.query;

      const cacheKey = `comments:${packageId}:${rating || 'all'}:${page}:${pageSize}:${sort}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      const where = { 
        packageId, 
        status: 1,
        parentId: null 
      };

      if (rating) {
        where.rating = parseInt(rating);
      }

      let order = [['createdAt', 'DESC']];
      if (sort === 'hot') {
        order = [['likeCount', 'DESC'], ['createdAt', 'DESC']];
      } else if (sort === 'rating') {
        order = [['rating', 'DESC'], ['createdAt', 'DESC']];
      }

      const { count, rows } = await Comment.findAndCountAll({
        where,
        order,
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'phone', 'realName', 'avatar']
          },
          {
            model: Comment,
            as: 'replies',
            where: { status: 1 },
            required: false,
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'phone', 'realName', 'avatar']
            }],
            order: [['createdAt', 'ASC']]
          }
        ]
      });

      const formattedList = rows.map(comment => {
        const user = comment.user?.toJSON() || {};
        return {
          ...comment.toJSON(),
          user: comment.isAnonymous ? {
            id: null,
            phone: '匿名用户',
            realName: '匿名用户',
            avatar: null
          } : {
            ...user,
            phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
          }
        };
      });

      const [ratingStats, tagStats] = await Promise.all([
        Comment.findAll({
          where: { packageId, status: 1, parentId: null },
          attributes: ['rating', [Comment.sequelize.fn('COUNT', Comment.sequelize.col('id')), 'count']],
          group: ['rating']
        }),
        Comment.findAll({
          where: { packageId, status: 1, parentId: null },
          attributes: ['tags']
        })
      ]);

      const ratingDistribution = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = 0;
      }
      ratingStats.forEach(item => {
        ratingDistribution[item.rating] = parseInt(item.dataValues.count) || 0;
      });

      const tagCounts = {};
      tagStats.forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const result = {
        list: formattedList,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        ratingDistribution,
        hotTags: Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      };

      await cache.set(cacheKey, result, 120);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取评论列表失败',
        error: error.message
      });
    }
  },

  getMyComments: async (req, res) => {
    try {
      const userId = req.userId;
      const { page = 1, pageSize = 20 } = req.query;

      const { count, rows } = await Comment.findAndCountAll({
        where: { userId, parentId: null },
        order: [['createdAt', 'DESC']],
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        include: [
          {
            model: Package,
            as: 'package',
            attributes: ['id', 'name', 'code', 'coverImage']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          list: rows,
          total: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取我的评论失败',
        error: error.message
      });
    }
  },

  likeComment: async (req, res) => {
    try {
      const userId = req.userId;
      const { commentId } = req.params;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: '评论不存在'
        });
      }

      const existingLike = await CommentLike.findOne({
        where: { userId, commentId }
      });

      if (existingLike) {
        await existingLike.destroy();
        await comment.decrement('likeCount');
        res.json({
          success: true,
          message: '已取消点赞',
          data: { isLiked: false }
        });
      } else {
        await CommentLike.create({ userId, commentId });
        await comment.increment('likeCount');
        res.json({
          success: true,
          message: '点赞成功',
          data: { isLiked: true }
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '操作失败',
        error: error.message
      });
    }
  },

  replyComment: async (req, res) => {
    try {
      const userId = req.userId;
      const { commentId } = req.params;
      const { content, replyToId } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '回复内容不能为空'
        });
      }

      const parentComment = await Comment.findByPk(commentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: '评论不存在'
        });
      }

      const reply = await Comment.create({
        userId,
        packageId: parentComment.packageId,
        content: content.trim(),
        parentId: commentId,
        replyToId,
        status: 1
      });

      await parentComment.increment('replyCount');

      res.json({
        success: true,
        message: '回复成功',
        data: {
          replyId: reply.id
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '回复失败',
        error: error.message
      });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const userId = req.userId;
      const { commentId } = req.params;

      const comment = await Comment.findOne({
        where: { id: commentId, userId }
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: '评论不存在或无权删除'
        });
      }

      await comment.update({ status: -1 });

      await cache.del(`comments:${comment.packageId}:*`);

      res.json({
        success: true,
        message: '评论已删除'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '删除评论失败',
        error: error.message
      });
    }
  }
};

module.exports = commentController;
