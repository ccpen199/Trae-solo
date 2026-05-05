const { Op } = require('sequelize');
const { Post, User, Comment, Like } = require('../models');
const { setCache, getCache, deleteCache } = require('../config/redis');

const getPostList = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category, 
      postType,
      keyword,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const cacheKey = `posts:${page}:${pageSize}:${category || 'all'}:${postType || 'all'}:${keyword || ''}:${sortBy}:${sortOrder}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    const offset = (page - 1) * pageSize;
    const where = { status: 'published' };

    if (category) {
      where.category = category;
    }
    if (postType) {
      where.postType = postType;
    }
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { content: { [Op.iLike]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar', 'userType', 'level']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(pageSize),
      offset: parseInt(offset),
      distinct: true
    });

    const result = {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };

    await setCache(cacheKey, result, 300);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getPostDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `post:${id}`;
    const cachedPost = await getCache(cacheKey);

    let post;
    if (cachedPost) {
      post = cachedPost;
    } else {
      post = await Post.findOne({
        where: { id, status: 'published' },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'nickname', 'avatar', 'userType', 'level', 'bio']
          }
        ]
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: '帖子不存在'
        });
      }

      await setCache(cacheKey, post.toJSON(), 600);
    }

    await Post.increment('viewCount', { where: { id } });

    let isLiked = false;
    if (req.user) {
      const like = await Like.findOne({
        where: {
          userId: req.user.id,
          targetType: 'post',
          targetId: id
        }
      });
      isLiked = !!like;
    }

    res.json({
      success: true,
      data: {
        ...(post.toJSON ? post.toJSON() : post),
        isLiked
      }
    });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, content, postType, category, tags, images, isAnonymous } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      });
    }

    const post = await Post.create({
      userId: req.user.id,
      title,
      content,
      postType: postType || 'discussion',
      category: category || 'pregnancy',
      tags: tags || [],
      images: images || [],
      isAnonymous: isAnonymous || false
    });

    await deleteCache('posts:*');

    res.status(201).json({
      success: true,
      message: '发布成功',
      data: post
    });
  } catch (error) {
    console.error('创建帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, images } = req.body;

    const post = await Post.findOne({
      where: { id, userId: req.user.id }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在或无权修改'
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (images !== undefined) updateData.images = images;

    await post.update(updateData);

    await deleteCache(`post:${id}`);
    await deleteCache('posts:*');

    res.json({
      success: true,
      message: '更新成功',
      data: post
    });
  } catch (error) {
    console.error('更新帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findOne({
      where: { id, userId: req.user.id }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在或无权删除'
      });
    }

    await post.update({ status: 'deleted' });

    await deleteCache(`post:${id}`);
    await deleteCache('posts:*');

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findOne({ where: { id, status: 'published' } });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    const existingLike = await Like.findOne({
      where: { userId, targetType: 'post', targetId: id }
    });

    if (existingLike) {
      await existingLike.destroy();
      await Post.decrement('likeCount', { where: { id } });
      
      res.json({
        success: true,
        message: '取消点赞',
        data: { isLiked: false }
      });
    } else {
      await Like.create({ userId, targetType: 'post', targetId: id });
      await Post.increment('likeCount', { where: { id } });
      
      res.json({
        success: true,
        message: '点赞成功',
        data: { isLiked: true }
      });
    }

    await deleteCache(`post:${id}`);
  } catch (error) {
    console.error('点赞帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Post.findAndCountAll({
      where: { 
        userId: req.user.id,
        status: { [Op.ne]: 'deleted' }
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset)
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
    console.error('获取我的帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = {
  getPostList,
  getPostDetail,
  createPost,
  updatePost,
  deletePost,
  likePost,
  getMyPosts
};
