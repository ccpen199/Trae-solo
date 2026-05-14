const express = require('express');
const { User, Article, Question, Follow } = require('../models');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');

const router = express.Router();

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    let result = user.toJSON();
    
    if (req.user && req.user.id !== id) {
      const follow = await Follow.findOne({
        where: { followerId: req.user.id, followingId: id }
      });
      result.isFollowing = !!follow;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.get('/:id/articles', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Article.findAndCountAll({
      where: { authorId: id, status: 'published' },
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
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
    console.error('Get user articles error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户文章失败'
    });
  }
});

router.get('/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Question.findAndCountAll({
      where: { authorId: id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
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
    console.error('Get user questions error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户问题失败'
    });
  }
});

router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }

    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const existingFollow = await Follow.findOne({
      where: { followerId: req.user.id, followingId: id }
    });

    let isFollowing = false;
    if (existingFollow) {
      await existingFollow.destroy();
      
      const currentUser = await User.findByPk(req.user.id);
      if (currentUser) {
        currentUser.followingCount = Math.max(0, (currentUser.followingCount || 0) - 1);
        await currentUser.save();
      }
      
      targetUser.followersCount = Math.max(0, (targetUser.followersCount || 0) - 1);
      await targetUser.save();
    } else {
      await Follow.create({
        followerId: req.user.id,
        followingId: id
      });
      
      const currentUser = await User.findByPk(req.user.id);
      if (currentUser) {
        currentUser.followingCount = (currentUser.followingCount || 0) + 1;
        await currentUser.save();
      }
      
      targetUser.followersCount = (targetUser.followersCount || 0) + 1;
      await targetUser.save();
      
      isFollowing = true;
      
      await createNotification({
        userId: id,
        type: 'follow',
        actorId: req.user.id,
        data: { followerId: req.user.id, followerName: req.user.nickname || req.user.username },
        link: `/user/${req.user.id}`
      });
    }

    res.json({
      success: true,
      data: { 
        isFollowing, 
        followersCount: targetUser.followersCount 
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.get('/:id/followers', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Follow.findAndCountAll({
      where: { followingId: id },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'nickname', 'avatar', 'bio']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });

    res.json({
      success: true,
      data: {
        list: rows.map(r => r.follower),
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: '获取粉丝列表失败'
    });
  }
});

router.get('/:id/following', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Follow.findAndCountAll({
      where: { followerId: id },
      include: [
        {
          model: User,
          as: 'following',
          attributes: ['id', 'nickname', 'avatar', 'bio']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    });

    res.json({
      success: true,
      data: {
        list: rows.map(r => r.following),
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: '获取关注列表失败'
    });
  }
});

module.exports = router;
