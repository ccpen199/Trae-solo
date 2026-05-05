const { Comment, User, Book, Activity, UserFavorite } = require('../models');
const { Op } = require('sequelize');

const getComments = async (req, res) => {
  try {
    const { sourceType, sourceId, isTop, isFeatured, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!sourceType || !sourceId) {
      return res.status(400).json({
        success: false,
        message: '请提供sourceType和sourceId'
      });
    }

    const where = {
      sourceType,
      sourceId,
      parentId: null,
      status: 'active'
    };
    if (isTop !== undefined) where.isTop = isTop === 'true';
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';

    const { count, rows } = await Comment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'replyToUser',
          attributes: ['id', 'nickname']
        },
        {
          model: Comment,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'nickname', 'avatar']
            },
            {
              model: User,
              as: 'replyToUser',
              attributes: ['id', 'nickname']
            }
          ],
          where: { status: 'active' },
          required: false,
          limit: 3,
          order: [['createdAt', 'ASC']]
        }
      ],
      order: [
        ['isTop', 'DESC'],
        ['isFeatured', 'DESC'],
        ['likeCount', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        comments: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: '获取评论列表失败'
    });
  }
};

const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'replyToUser',
          attributes: ['id', 'nickname']
        }
      ]
    });

    if (!comment || comment.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    res.json({
      success: true,
      data: { comment }
    });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({
      success: false,
      message: '获取评论详情失败'
    });
  }
};

const createComment = async (req, res) => {
  try {
    const { sourceType, sourceId, content, parentId, replyToId, rating, images, tags, isAnonymous } = req.body;

    if (!sourceType || !sourceId || !content) {
      return res.status(400).json({
        success: false,
        message: '请提供sourceType、sourceId和content'
      });
    }

    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: '被回复的评论不存在'
        });
      }
    }

    let targetContent = '';
    if (sourceType === 'book') {
      const book = await Book.findByPk(sourceId);
      if (book) targetContent = `评论了《${book.title}》`;
    }

    const comment = await Comment.create({
      sourceType,
      sourceId,
      content,
      parentId,
      replyToId,
      userId: req.user.id,
      rating,
      images: images || [],
      tags: tags || [],
      isAnonymous: isAnonymous || false
    });

    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (parentComment) {
        await parentComment.increment('replyCount');
      }
    }

    if (sourceType === 'book' && rating) {
      const book = await Book.findByPk(sourceId);
      if (book) {
        const ratingComments = await Comment.findAndCountAll({
          where: { sourceType: 'book', sourceId, rating: { [Op.not]: null }, status: 'active' }
        });
        
        const newRatingCount = ratingComments.count + 1;
        const newRatingSum = (book.rating * book.ratingCount) + rating;
        const newRating = newRatingSum / newRatingCount;

        await book.update({
          rating: parseFloat(newRating.toFixed(2)),
          ratingCount: newRatingCount,
          reviewCount: book.reviewCount + 1
        });
      }
    } else if (sourceType === 'book') {
      const book = await Book.findByPk(sourceId);
      if (book) {
        await book.increment('reviewCount');
      }
    }

    await Activity.create({
      userId: req.user.id,
      action: 'comment',
      targetType: sourceType,
      targetId: sourceId,
      content: targetContent || content.substring(0, 100)
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar'] },
        { model: User, as: 'replyToUser', attributes: ['id', 'nickname'] }
      ]
    });

    res.status(201).json({
      success: true,
      data: { comment: fullComment },
      message: '评论发表成功'
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: '发表评论失败'
    });
  }
};

const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, images, tags } = req.body;

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
        message: '无权限修改该评论'
      });
    }

    await comment.update({ content, images, tags });

    res.json({
      success: true,
      data: { comment },
      message: '评论更新成功'
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: '更新评论失败'
    });
  }
};

const deleteComment = async (req, res) => {
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
        message: '无权限删除该评论'
      });
    }

    if (comment.parentId) {
      const parentComment = await Comment.findByPk(comment.parentId);
      if (parentComment) {
        await parentComment.decrement('replyCount');
      }
    }

    if (comment.sourceType === 'book' && comment.rating) {
      const book = await Book.findByPk(comment.sourceId);
      if (book && book.ratingCount > 0) {
        const newRatingCount = book.ratingCount - 1;
        if (newRatingCount > 0) {
          const ratingComments = await Comment.findAndCountAll({
            where: { 
              sourceType: 'book', 
              sourceId: comment.sourceId, 
              rating: { [Op.not]: null }, 
              status: 'active',
              id: { [Op.ne]: id }
            }
          });
          
          const newRatingSum = ratingComments.rows.reduce((sum, c) => sum + c.rating, 0);
          const newRating = newRatingSum / newRatingCount;

          await book.update({
            rating: parseFloat(newRating.toFixed(2)),
            ratingCount: newRatingCount,
            reviewCount: Math.max(0, book.reviewCount - 1)
          });
        } else {
          await book.update({
            rating: 0,
            ratingCount: 0,
            reviewCount: Math.max(0, book.reviewCount - 1)
          });
        }
      }
    } else if (comment.sourceType === 'book') {
      const book = await Book.findByPk(comment.sourceId);
      if (book) {
        await book.update({
          reviewCount: Math.max(0, book.reviewCount - 1)
        });
      }
    }

    await comment.destroy();

    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: '删除评论失败'
    });
  }
};

const likeComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id);
    if (!comment || comment.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    const existing = await UserFavorite.findOne({
      where: { userId: req.user.id, targetType: 'comment', targetId: id }
    });

    if (existing) {
      await existing.destroy();
      await comment.decrement('likeCount');
      res.json({
        success: true,
        data: { isLiked: false, likeCount: comment.likeCount - 1 },
        message: '取消点赞成功'
      });
    } else {
      await UserFavorite.create({
        userId: req.user.id,
        targetType: 'comment',
        targetId: id
      });
      await comment.increment('likeCount');

      res.json({
        success: true,
        data: { isLiked: true, likeCount: comment.likeCount + 1 },
        message: '点赞成功'
      });
    }
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
};

const getWeiboComments = async (req, res) => {
  try {
    const { sourceId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      sourceType: 'weibo',
      status: 'active'
    };
    if (sourceId) where.weiboSourceId = sourceId;

    const { count, rows } = await Comment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const mockWeiboComments = [
      {
        id: 'wb-001',
        sourceType: 'weibo',
        weiboSourceId: '123456789',
        weiboSourceUrl: 'https://weibo.com/123456789',
        content: '这本书真的太好看了！推荐给所有喜欢阅读的朋友们！',
        weiboSourceUser: {
          id: 'wb-user-001',
          nickname: '读书爱好者小王',
          avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20of%20young%20chinese%20woman%20reading%20book%20cozy%20cafe&image_size=square_hd'
        },
        likeCount: 256,
        replyCount: 34,
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'wb-002',
        sourceType: 'weibo',
        weiboSourceId: '123456790',
        weiboSourceUrl: 'https://weibo.com/123456790',
        content: '终于看完了，作者的文笔真的很棒，情节跌宕起伏，让人欲罢不能。',
        weiboSourceUser: {
          id: 'wb-user-002',
          nickname: '书虫小李',
          avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20of%20young%20chinese%20man%20with%20glasses%20holding%20book&image_size=square_hd'
        },
        likeCount: 189,
        replyCount: 22,
        createdAt: new Date(Date.now() - 172800000)
      },
      {
        id: 'wb-003',
        sourceType: 'weibo',
        weiboSourceId: '123456791',
        weiboSourceUrl: 'https://weibo.com/123456791',
        content: '#读书分享# 最近在读的一本好书，强烈推荐！书中的观点很有启发性。',
        weiboSourceUser: {
          id: 'wb-user-003',
          nickname: '文艺女青年',
          avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20of%20chinese%20woman%20in%20library%20surrounded%20by%20books&image_size=square_hd'
        },
        likeCount: 342,
        replyCount: 56,
        createdAt: new Date(Date.now() - 259200000)
      }
    ];

    const allComments = [...rows, ...mockWeiboComments];

    res.json({
      success: true,
      data: {
        comments: allComments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count + mockWeiboComments.length,
          totalPages: Math.ceil((count + mockWeiboComments.length) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get weibo comments error:', error);
    res.status(500).json({
      success: false,
      message: '获取微博评论失败'
    });
  }
};

module.exports = {
  getComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  getWeiboComments
};
