const { Op, fn, col } = require('sequelize');
const { 
  User, 
  Resource, 
  Comment, 
  Group, 
  GroupMember,
  ActivityLog,
  SearchLog,
  Category
} = require('../models');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsersToday,
      totalResources,
      pendingResources,
      totalGroups,
      totalComments,
      pendingComments,
    ] = await Promise.all([
      User.count(),
      ActivityLog.count({
        where: {
          action: 'login',
          createdAt: { [Op.gte]: new Date(today.setHours(0, 0, 0, 0)) }
        }
      }),
      Resource.count({ where: { status: 'published' } }),
      Resource.count({ where: { status: 'pending' } }),
      Group.count({ where: { status: 'active' } }),
      Comment.count({ where: { status: 'published' } }),
      Comment.count({ where: { status: 'pending' } }),
    ]);

    const newUsersByDay = await ActivityLog.findAll({
      attributes: [
        [fn('date', col('createdAt')), 'date'],
        [fn('count', col('id')), 'count']
      ],
      where: {
        action: 'register',
        createdAt: { [Op.gte]: weekAgo }
      },
      group: [fn('date', col('createdAt'))],
      order: [[fn('date', col('createdAt')), 'ASC']]
    });

    const topSearchKeywords = await SearchLog.findAll({
      attributes: [
        'keyword',
        [fn('count', col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: weekAgo }
      },
      group: ['keyword'],
      order: [[fn('count', col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsersToday,
          totalResources,
          pendingResources,
          totalGroups,
          totalComments,
          pendingComments,
        },
        newUsersByDay,
        topSearchKeywords
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取统计数据失败' 
    });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: { status: 'pending' },
      attributes: ['id', 'username', 'email', 'nickname', 'avatar', 'createdAt'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取待审核用户失败' 
    });
  }
};

const reviewUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    if (action === 'approve') {
      user.status = 'active';
    } else if (action === 'reject') {
      user.status = 'banned';
    } else {
      return res.status(400).json({ 
        success: false, 
        message: '无效的操作' 
      });
    }

    await user.save();

    res.json({
      success: true,
      message: action === 'approve' ? '用户已通过审核' : '用户已被拒绝',
      data: { user: { id: user.id, status: user.status } }
    });
  } catch (error) {
    console.error('Review user error:', error);
    res.status(500).json({ 
      success: false, 
      message: '审核用户失败' 
    });
  }
};

const getPendingResources = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Resource.findAndCountAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
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
    console.error('Get pending resources error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取待审核资源失败' 
    });
  }
};

const reviewResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: '资源不存在' 
      });
    }

    if (action === 'approve') {
      resource.status = 'published';
      resource.publishedAt = new Date();
    } else if (action === 'reject') {
      resource.status = 'rejected';
    } else {
      return res.status(400).json({ 
        success: false, 
        message: '无效的操作' 
      });
    }

    await resource.save();

    res.json({
      success: true,
      message: action === 'approve' ? '资源已通过审核' : '资源已被拒绝',
      data: { resource: { id: resource.id, status: resource.status } }
    });
  } catch (error) {
    console.error('Review resource error:', error);
    res.status(500).json({ 
      success: false, 
      message: '审核资源失败' 
    });
  }
};

const getPendingComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Comment.findAndCountAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: Resource,
          as: 'resource',
          attributes: ['id', 'title']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
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
    console.error('Get pending comments error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取待审核评论失败' 
    });
  }
};

const reviewComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: '评论不存在' 
      });
    }

    if (action === 'approve') {
      comment.status = 'published';
    } else if (action === 'reject') {
      comment.status = 'rejected';
    } else {
      return res.status(400).json({ 
        success: false, 
        message: '无效的操作' 
      });
    }

    await comment.save();

    res.json({
      success: true,
      message: action === 'approve' ? '评论已通过审核' : '评论已被拒绝',
      data: { comment: { id: comment.id, status: comment.status } }
    });
  } catch (error) {
    console.error('Review comment error:', error);
    res.status(500).json({ 
      success: false, 
      message: '审核评论失败' 
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取分类列表失败' 
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, slug, description, icon, sortOrder, parentId } = req.body;

    const existingCategory = await Category.findOne({
      where: { [Op.or]: [{ name }, { slug }] }
    });

    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: '分类名称或标识已存在' 
      });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      icon,
      sortOrder: sortOrder || 0,
      parentId,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: { category }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建分类失败' 
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, sortOrder, status } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: '分类不存在' 
      });
    }

    if (name !== undefined) category.name = name;
    if (slug !== undefined) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (status !== undefined) category.status = status;

    await category.save();

    res.json({
      success: true,
      message: '分类更新成功',
      data: { category }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新分类失败' 
    });
  }
};

module.exports = {
  getDashboardStats,
  getPendingUsers,
  reviewUser,
  getPendingResources,
  reviewResource,
  getPendingComments,
  reviewComment,
  getCategories,
  createCategory,
  updateCategory,
};
