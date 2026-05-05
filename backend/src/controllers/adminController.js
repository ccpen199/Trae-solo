const { Op } = require('sequelize');
const { User, Board, Topic, Reply, BoardModerator, OperationLog } = require('../models');

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const { username, role, status } = req.query;

    const whereClause = {};
    
    if (username) {
      whereClause.username = { [Op.iLike]: `%${username}%` };
    }
    if (role) {
      whereClause.role = role;
    }
    if (status !== undefined) {
      whereClause.status = parseInt(status);
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      include: [
        {
          model: Board,
          as: 'moderatedBoards',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      data: {
        list: users.map(user => user.toJSON()),
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(User.ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户角色'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能修改自己的角色'
      });
    }

    await user.update({ role });

    res.json({
      success: true,
      message: '用户角色更新成功',
      data: user.toJSON()
    });
  } catch (error) {
    console.error('更新用户角色错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能修改自己的状态'
      });
    }

    if (user.role === User.ROLES.ADMIN && status === 0) {
      return res.status(400).json({
        success: false,
        message: '不能禁用管理员账号'
      });
    }

    await user.update({ status });

    res.json({
      success: true,
      message: status === 1 ? '用户已启用' : '用户已禁用',
      data: user.toJSON()
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const assignModerator = async (req, res) => {
  try {
    const { userId, boardId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const board = await Board.findByPk(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: '版块不存在'
      });
    }

    const existing = await BoardModerator.findOne({
      where: { userId, boardId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '该用户已是此版块的版主'
      });
    }

    await BoardModerator.create({ userId, boardId });

    if (user.role !== User.ROLES.MODERATOR && user.role !== User.ROLES.ADMIN) {
      await user.update({ role: User.ROLES.MODERATOR });
    }

    res.json({
      success: true,
      message: '版主分配成功'
    });
  } catch (error) {
    console.error('分配版主错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const removeModerator = async (req, res) => {
  try {
    const { userId, boardId } = req.body;

    const deleted = await BoardModerator.destroy({
      where: { userId, boardId }
    });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: '版主关系不存在'
      });
    }

    const remainingBoards = await BoardModerator.count({
      where: { userId }
    });

    if (remainingBoards === 0) {
      const user = await User.findByPk(userId);
      if (user && user.role === User.ROLES.MODERATOR) {
        await user.update({ role: User.ROLES.USER });
      }
    }

    res.json({
      success: true,
      message: '版主移除成功'
    });
  } catch (error) {
    console.error('移除版主错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const getStatistics = async (req, res) => {
  try {
    const userCount = await User.count();
    const boardCount = await Board.count({ where: { status: 1 } });
    const topicCount = await Topic.count({
      where: { status: { [Op.ne]: Topic.STATUSES.DELETED } }
    });
    const replyCount = await Reply.count({ where: { status: 1 } });

    res.json({
      success: true,
      data: {
        userCount,
        boardCount,
        topicCount,
        replyCount
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const getOperationLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const { action, targetType, userId } = req.query;

    const whereClause = {};
    
    if (action) {
      whereClause.action = action;
    }
    if (targetType) {
      whereClause.targetType = targetType;
    }
    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    const { count, rows: logs } = await OperationLog.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    res.json({
      success: true,
      data: {
        list: logs.map(log => log.toJSON()),
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('获取操作日志错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const adminDeleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findByPk(id, {
      include: [{ model: Board }]
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }

    await topic.update({ status: Topic.STATUSES.DELETED });
    await topic.destroy();

    if (topic.Board) {
      await topic.Board.decrement('topicCount');
    }

    res.json({
      success: true,
      message: '主题删除成功'
    });
  } catch (error) {
    console.error('管理员删除主题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const adminDeleteReply = async (req, res) => {
  try {
    const { id } = req.params;

    const reply = await Reply.findByPk(id, {
      include: [{ model: Topic }]
    });

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: '回复不存在'
      });
    }

    await reply.destroy();

    if (reply.Topic) {
      await reply.Topic.decrement('replyCount');
    }

    res.json({
      success: true,
      message: '回复删除成功'
    });
  } catch (error) {
    console.error('管理员删除回复错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  assignModerator,
  removeModerator,
  getStatistics,
  getOperationLogs,
  adminDeleteTopic,
  adminDeleteReply
};
