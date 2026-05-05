const { User, OperationLog } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, role, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { realName: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status !== undefined && status !== '') {
      where.status = status === 'true';
    }
    
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'realName', 'phone', 'email', 'role', 'status', 'lastLoginAt', 'createdAt', 'updatedAt'],
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
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'realName', 'phone', 'email', 'role', 'status', 'lastLoginAt', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      throw new AppError('用户不存在', 404);
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { username, password, realName, phone, email, role, status } = req.body;
    
    if (!username || !password) {
      throw new AppError('用户名和密码不能为空', 400);
    }
    
    if (password.length < 6) {
      throw new AppError('密码长度不能少于6位', 400);
    }
    
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new AppError('用户名已存在', 400);
    }
    
    const user = await User.create({
      username,
      password,
      realName,
      phone,
      email,
      role: role || 'operator',
      status: status !== undefined ? status : true
    });
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'user',
      action: 'create',
      targetId: user.id,
      targetType: 'User',
      description: `创建用户：${username}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '用户创建成功',
      data: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { realName, phone, email, role, status, password } = req.body;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new AppError('用户不存在', 404);
    }
    
    const updateData = { realName, phone, email, role, status };
    
    if (password) {
      if (password.length < 6) {
        throw new AppError('密码长度不能少于6位', 400);
      }
      updateData.password = password;
    }
    
    await user.update(updateData);
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'user',
      action: 'update',
      targetId: user.id,
      targetType: 'User',
      description: `更新用户：${user.username}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '用户更新成功'
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new AppError('用户不存在', 404);
    }
    
    if (user.username === 'admin') {
      throw new AppError('不能删除管理员账号', 400);
    }
    
    const username = user.username;
    await user.destroy();
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'user',
      action: 'delete',
      targetId: id,
      targetType: 'User',
      description: `删除用户：${username}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new AppError('用户不存在', 404);
    }
    
    if (user.username === 'admin') {
      throw new AppError('不能禁用管理员账号', 400);
    }
    
    user.status = !user.status;
    await user.save();
    
    await OperationLog.create({
      userId: req.user.id,
      username: req.user.username,
      module: 'user',
      action: 'toggle',
      targetId: user.id,
      targetType: 'User',
      description: `切换用户状态：${user.username} - ${user.status ? '启用' : '禁用'}`,
      ipAddress: req.ip
    });
    
    res.json({
      success: true,
      message: `用户已${user.status ? '启用' : '禁用'}`,
      data: { status: user.status }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
};
