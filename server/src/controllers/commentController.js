const { Op } = require('sequelize');
const { Comment, User, Post, Like } = require('../models');

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Comment.findAndCountAll({
      where: { 
        postId, 
        parentId: null,
        status: 'published'
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar', 'userType', 'level']
        },
        {
          model: Comment,
          as: 'replies',
          where: { status: 'published' },
          required: false,
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'nickname', 'avatar']
            }
          ],
          order: [['createdAt', 'ASC']],
          limit: 3
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset),
      distinct: true
    });

    let likedCommentIds = [];
    if (req.user) {
      const likes = await Like.findAll({
        where: {
          userId: req.user.id,
          targetType: 'comment',
          targetId: rows.map(c => c.id)
        }
      });
      likedCommentIds = likes.map(l => l.targetId);
    }

    const commentsWithLikeStatus = rows.map(comment => ({
      ...comment.toJSON(),
      isLiked: likedCommentIds.includes(comment.id)
    }));

    res.json({
      success: true,
      data: {
        list: commentsWithLikeStatus,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentId, replyToUserId, images, isAnonymous } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    const post = await Post.findOne({ where: { id: postId, status: 'published' } });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    const comment = await Comment.create({
      postId,
      userId: req.user.id,
      parentId: parentId || null,
      replyToUserId: replyToUserId || null,
      content,
      images: images || [],
      isAnonymous: isAnonymous || false
    });

    await Post.increment('commentCount', { where: { id: postId } });
    await Post.update({ lastCommentAt: new Date() }, { where: { id: postId } });

    const fullComment = await Comment.findOne({
      where: { id: comment.id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar', 'userType', 'level']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '评论成功',
      data: fullComment
    });
  } catch (error) {
    console.error('创建评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findOne({ where: { id, status: 'published' } });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    const existingLike = await Like.findOne({
      where: { userId, targetType: 'comment', targetId: id }
    });

    if (existingLike) {
      await existingLike.destroy();
      await Comment.decrement('likeCount', { where: { id } });
      
      res.json({
        success: true,
        message: '取消点赞',
        data: { isLiked: false }
      });
    } else {
      await Like.create({ userId, targetType: 'comment', targetId: id });
      await Comment.increment('likeCount', { where: { id } });
      
      res.json({
        success: true,
        message: '点赞成功',
        data: { isLiked: true }
      });
    }
  } catch (error) {
    console.error('点赞评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findOne({
      where: { id, userId: req.user.id }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在或无权删除'
      });
    }

    await comment.update({ status: 'deleted' });
    await Post.decrement('commentCount', { where: { id: comment.postId } });

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = {
  getComments,
  createComment,
  likeComment,
  deleteComment
};
