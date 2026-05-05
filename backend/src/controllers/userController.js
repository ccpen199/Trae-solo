const db = require('../models');
const { Op } = require('sequelize');

const getUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, roleId } = req.query;
    
    const where = {};
    
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { realName: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }
    
    if (roleId) {
      where.roleId = roleId;
    }
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    const { count, rows } = await db.User.findAndCountAll({
      where,
      include: [
        { model: db.Role, as: 'role' }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取用户列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await db.User.findByPk(id, {
      include: [
        { model: db.Role, as: 'role' }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: user
    });
    
  } catch (error) {
    console.error('获取用户详情错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, realName, phone, roleId, status = 1 } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }
    
    const existingUser = await db.User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      });
    }
    
    const role = await db.Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({
        code: 400,
        message: '角色不存在'
      });
    }
    
    const user = await db.User.create({
      username,
      password,
      realName,
      phone,
      roleId,
      status
    });
    
    return res.json({
      code: 200,
      message: '创建成功',
      data: user
    });
    
  } catch (error) {
    console.error('创建用户错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { realName, phone, roleId, status } = req.body;
    
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    if (roleId) {
      const role = await db.Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({
          code: 400,
          message: '角色不存在'
        });
      }
    }
    
    await user.update({
      realName,
      phone,
      roleId,
      status
    });
    
    return res.json({
      code: 200,
      message: '更新成功',
      data: user
    });
    
  } catch (error) {
    console.error('更新用户错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({
        code: 400,
        message: '新密码不能为空'
      });
    }
    
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    return res.json({
      code: 200,
      message: '密码重置成功'
    });
    
  } catch (error) {
    console.error('重置密码错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === req.user.id) {
      return res.status(400).json({
        code: 400,
        message: '不能删除当前登录用户'
      });
    }
    
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    await user.destroy();
    
    return res.json({
      code: 200,
      message: '删除成功'
    });
    
  } catch (error) {
    console.error('删除用户错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await db.Role.findAll({
      where: { status: 1 },
      order: [['name', 'ASC']]
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: roles
    });
    
  } catch (error) {
    console.error('获取角色列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  getRoles
};
