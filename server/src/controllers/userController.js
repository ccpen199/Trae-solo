const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { 
  User, 
  Resource, 
  Favorite, 
  Group, 
  GroupMember, 
  Friendship,
  ActivityLog 
} = require('../models');

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'nickname', 'avatar', 'bio', 'role', 'status', 'loginCount', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    const resourceCount = await Resource.count({ where: { userId: id, status: 'published' } });
    const favoriteCount = await Favorite.count({ where: { userId: id } });
    const groupCount = await GroupMember.count({ where: { userId: id, status: 'active' } });

    const friends = await Friendship.findAll({
      where: { 
        [Op.or]: [{ userId: id }, { friendId: id }],
        status: 'accepted'
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          resourceCount,
          favoriteCount,
          groupCount,
          friendCount: friends.length
        }
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户信息失败' 
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nickname, bio, avatar } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    if (nickname !== undefined) user.nickname = nickname;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: '个人信息更新成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新个人信息失败' 
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { status: 'active' };
    if (keyword) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { username: { [Op.iLike]: `%${keyword}%` } },
          { nickname: { [Op.iLike]: `%${keyword}%` } },
          { bio: { [Op.iLike]: `%${keyword}%` } }
        ]
      };
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'username', 'nickname', 'avatar', 'bio', 'role', 'createdAt'],
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
    console.error('Search users error:', error);
    res.status(500).json({ 
      success: false, 
      message: '搜索用户失败' 
    });
  }
};

const getUserResources = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Resource.findAndCountAll({
      where: { 
        userId: id,
        status: 'published'
      },
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
    console.error('Get user resources error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户资源失败' 
    });
  }
};

const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Favorite.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Resource,
          as: 'resource',
          where: { status: 'published' },
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        favorites: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user favorites error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取收藏列表失败' 
    });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const favorite = await Favorite.findOne({
      where: { id, userId }
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: '收藏不存在'
      });
    }

    await favorite.destroy();

    res.json({
      success: true,
      message: '取消收藏成功'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: '取消收藏失败'
    });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  searchUsers,
  getUserResources,
  getUserFavorites,
  removeFavorite,
};
