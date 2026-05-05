const express = require('express');
const { Op } = require('sequelize');
const { Topic, Reply, User, OperationLog, Role, sequelize } = require('../models');
const { requireRoleLevel, isModerator, isAdmin } = require('../middleware/auth');
const logService = require('../services/logService');

const router = express.Router();

router.put('/topics/:id/lock', requireRoleLevel(50), async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findByPk(id);
    if (!topic || !topic.isVisible || topic.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '主题不存在或已被删除'
      });
    }

    if (topic.status === 'locked') {
      return res.status(400).json({
        success: false,
        message: '主题已经被锁定'
      });
    }

    const originalStatus = topic.status;
    await topic.update({ status: 'locked' });

    await logService.logLockTopic(req, topic);

    res.json({
      success: true,
      message: '锁定成功',
      data: { originalStatus }
    });
  } catch (error) {
    console.error('锁定主题错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.put('/topics/:id/unlock', requireRoleLevel(50), async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findByPk(id);
    if (!topic || !topic.isVisible || topic.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '主题不存在或已被删除'
      });
    }

    if (topic.status !== 'locked') {
      return res.status(400).json({
        success: false,
        message: '主题未被锁定'
      });
    }

    await topic.update({ status: 'normal' });

    await logService.logUnlockTopic(req, topic);

    res.json({
      success: true,
      message: '解锁成功'
    });
  } catch (error) {
    console.error('解锁主题错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.put('/topics/:id/top', requireRoleLevel(50), async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findByPk(id);
    if (!topic || !topic.isVisible || topic.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '主题不存在或已被删除'
      });
    }

    if (topic.status === 'top') {
      return res.status(400).json({
        success: false,
        message: '主题已经被置顶'
      });
    }

    const originalStatus = topic.status;
    await topic.update({ status: 'top' });

    await logService.logTopTopic(req, topic);

    res.json({
      success: true,
      message: '置顶成功',
      data: { originalStatus }
    });
  } catch (error) {
    console.error('置顶主题错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.put('/topics/:id/untop', requireRoleLevel(50), async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findByPk(id);
    if (!topic || !topic.isVisible || topic.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '主题不存在或已被删除'
      });
    }

    if (topic.status !== 'top') {
      return res.status(400).json({
        success: false,
        message: '主题未被置顶'
      });
    }

    await topic.update({ status: 'normal' });

    await logService.logUntopTopic(req, topic);

    res.json({
      success: true,
      message: '取消置顶成功'
    });
  } catch (error) {
    console.error('取消置顶主题错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.put('/topics/:id/highlight', requireRoleLevel(50), async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findByPk(id);
    if (!topic || !topic.isVisible || topic.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '主题不存在或已被删除'
      });
    }

    if (topic.status === 'highlight') {
      return res.status(400).json({
        success: false,
        message: '主题已经被加精'
      });
    }

    const originalStatus = topic.status;
    await topic.update({ status: 'highlight' });

    await logService.logHighlightTopic(req, topic);

    res.json({
      success: true,
      message: '加精成功',
      data: { originalStatus }
    });
  } catch (error) {
    console.error('加精主题错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.put('/topics/:id/unhighlight', requireRoleLevel(50), async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findByPk(id);
    if (!topic || !topic.isVisible || topic.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: '主题不存在或已被删除'
      });
    }

    if (topic.status !== 'highlight') {
      return res.status(400).json({
        success: false,
        message: '主题未被加精'
      });
    }

    await topic.update({ status: 'normal' });

    await logService.logUnhighlightTopic(req, topic);

    res.json({
      success: true,
      message: '取消加精成功'
    });
  } catch (error) {
    console.error('取消加精主题错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.put('/topics/:id/status', requireRoleLevel(50), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['normal', 'highlight', 'top', 'locked', 'deleted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const topic = await Topic.findByPk(id);
    if (!topic || !topic.isVisible) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }

    await topic.update({ status });

    res.json({
      success: true,
      message: '状态更新成功',
      data: topic
    });
  } catch (error) {
    console.error('更新主题状态错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.put('/replies/:id/status', requireRoleLevel(50), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['normal', 'deleted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const reply = await Reply.findByPk(id);
    if (!reply || !reply.isVisible) {
      return res.status(404).json({
        success: false,
        message: '回复不存在'
      });
    }

    await reply.update({ status, isVisible: status !== 'deleted' });

    res.json({
      success: true,
      message: '状态更新成功'
    });
  } catch (error) {
    console.error('更新回复状态错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.put('/users/:id/ban', requireRoleLevel(100), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (isAdmin(req) && user.role?.level >= 100 && user.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无法封禁管理员'
      });
    }

    await user.update({ status: 'banned' });

    await logService.logBanUser(req, user, reason);

    res.json({
      success: true,
      message: '封禁成功'
    });
  } catch (error) {
    console.error('封禁用户错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.put('/users/:id/unban', requireRoleLevel(100), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.status !== 'banned') {
      return res.status(400).json({
        success: false,
        message: '用户未被封禁'
      });
    }

    await user.update({ status: 'active' });

    await logService.logUnbanUser(req, user);

    res.json({
      success: true,
      message: '解封成功'
    });
  } catch (error) {
    console.error('解封用户错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.put('/users/:id/role', requireRoleLevel(100), async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        });
      }
    }

    await user.update({ roleId });

    await logService.logOperation(req, 'update_user_role', {
      targetType: 'user',
      targetId: user.id,
      targetName: user.username,
      detail: { newRoleId: roleId }
    });

    res.json({
      success: true,
      message: '角色更新成功'
    });
  } catch (error) {
    console.error('更新用户角色错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.get('/logs', requireRoleLevel(50), async (req, res) => {
  try {
    const { page = 1, pageSize = 20, operationType, userId, targetType } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const where = {};
    if (operationType) where.operationType = operationType;
    if (userId) where.userId = userId;
    if (targetType) where.targetType = targetType;

    const { count, rows: logs } = await OperationLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取操作日志错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/users', requireRoleLevel(50), async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const where = {};
    if (status) where.status = status;
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'displayName', 'level']
      }],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count,
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/roles', requireRoleLevel(100), async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['level', 'DESC']]
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

router.get('/stats', requireRoleLevel(50), async (req, res) => {
  try {
    const [userStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as activeUsers,
        COUNT(CASE WHEN status = 'banned' THEN 1 END) as bannedUsers
      FROM users
    `);

    const [topicStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as totalTopics,
        COUNT(CASE WHEN status = 'normal' THEN 1 END) as normalTopics,
        COUNT(CASE WHEN status = 'top' THEN 1 END) as topTopics,
        COUNT(CASE WHEN status = 'highlight' THEN 1 END) as highlightTopics,
        COUNT(CASE WHEN status = 'locked' THEN 1 END) as lockedTopics
      FROM topics
      WHERE "isVisible" = true
    `);

    const [replyStats] = await sequelize.query(`
      SELECT COUNT(*) as totalReplies
      FROM replies
      WHERE "isVisible" = true AND status = 'normal'
    `);

    const [boardStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as totalBoards,
        SUM("topicCount") as totalTopicCount,
        SUM("replyCount") as totalReplyCount
      FROM boards
      WHERE "isVisible" = true
    `);

    res.json({
      success: true,
      data: {
        users: userStats[0],
        topics: topicStats[0],
        replies: replyStats[0],
        boards: boardStats[0]
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

module.exports = router;
