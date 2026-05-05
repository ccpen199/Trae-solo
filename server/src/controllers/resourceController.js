const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { 
  Resource, 
  Category, 
  User, 
  Comment, 
  Favorite,
  SearchLog,
  ActivityLog 
} = require('../models');
const { getWithFallback } = require('../config/redis');

const getResources = async (req, res) => {
  try {
    const { 
      categoryId, 
      keyword, 
      sort = 'newest', 
      page = 1, 
      limit = 12 
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { status: 'published' };
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (keyword) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { title: { [Op.iLike]: `%${keyword}%` } },
          { description: { [Op.iLike]: `%${keyword}%` } },
          { content: { [Op.iLike]: `%${keyword}%` } },
          { tags: { [Op.contains]: [keyword] } }
        ]
      };

      await SearchLog.create({
        keyword,
        searchType: 'resource',
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    let order = [['createdAt', 'DESC']];
    switch (sort) {
      case 'hot':
        order = [['viewCount', 'DESC']];
        break;
      case 'most_liked':
        order = [['favoriteCount', 'DESC']];
        break;
      case 'most_commented':
        order = [['commentCount', 'DESC']];
        break;
      default:
        order = [['createdAt', 'DESC']];
    }

    const { count, rows } = await Resource.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order
    });

    res.json({
      success: true,
      data: {
        resources: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取资源列表失败' 
    });
  }
};

const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar', 'bio']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: '资源不存在' 
      });
    }

    if (resource.status !== 'published') {
      return res.status(403).json({ 
        success: false, 
        message: '资源未发布' 
      });
    }

    resource.viewCount += 1;
    await resource.save();

    let isFavorited = false;
    if (req.user) {
      isFavorited = await Favorite.findOne({
        where: { userId: req.user.id, resourceId: resource.id }
      }).then(fav => !!fav);
    }

    const comments = await Comment.findAll({
      where: { resourceId: resource.id, status: 'published', parentId: null },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        resource: {
          ...resource.toJSON(),
          isFavorited
        },
        comments
      }
    });
  } catch (error) {
    console.error('Get resource by id error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取资源详情失败' 
    });
  }
};

const createResource = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { 
      title, 
      description, 
      content, 
      categoryId, 
      fileUrl, 
      fileType,
      coverImage,
      tags 
    } = req.body;

    const slug = `${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')}`;

    const resource = await Resource.create({
      title,
      slug,
      description,
      content,
      categoryId,
      userId: req.user.id,
      fileUrl,
      fileType: fileType || 'document',
      coverImage,
      tags: tags || [],
      status: 'published'
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: 'create_resource',
      targetType: 'resource',
      targetId: resource.id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: '资源创建成功',
      data: { resource }
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建资源失败' 
    });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: '资源不存在' 
      });
    }

    const existingFavorite = await Favorite.findOne({
      where: { userId, resourceId: id }
    });

    let isFavorited = false;

    if (existingFavorite) {
      await existingFavorite.destroy();
      resource.favoriteCount = Math.max(0, resource.favoriteCount - 1);
      isFavorited = false;
    } else {
      await Favorite.create({
        userId,
        resourceId: id,
        favoriteType: 'resource'
      });
      resource.favoriteCount += 1;
      isFavorited = true;

      await ActivityLog.create({
        userId,
        action: 'favorite',
        targetType: 'resource',
        targetId: id,
        ipAddress: req.ip,
      });
    }

    await resource.save();

    res.json({
      success: true,
      data: { isFavorited, favoriteCount: resource.favoriteCount }
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ 
      success: false, 
      message: '操作失败' 
    });
  }
};

const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { content, parentId, replyToUserId } = req.body;
    const userId = req.user.id;

    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: '资源不存在' 
      });
    }

    const comment = await Comment.create({
      content,
      userId,
      resourceId: id,
      parentId,
      replyToUserId,
      status: 'published'
    });

    resource.commentCount += 1;
    await resource.save();

    await ActivityLog.create({
      userId,
      action: 'comment',
      targetType: 'resource',
      targetId: id,
      ipAddress: req.ip,
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '评论发表成功',
      data: { comment: fullComment }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false, 
      message: '发表评论失败' 
    });
  }
};

module.exports = {
  getResources,
  getResourceById,
  createResource,
  toggleFavorite,
  addComment,
};
