const db = require('../models');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, username, name, roleId, status } = req.query;
    
    const where = {};
    if (username) where.username = { [db.Sequelize.Op.like]: `%${username}%` };
    if (name) where.name = { [db.Sequelize.Op.like]: `%${name}%` };
    if (roleId) where.roleId = roleId;
    if (status !== undefined && status !== '') where.status = status === 'true';

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const { count, rows } = await db.User.findAndCountAll({
      where,
      include: [{
        model: db.Role,
        as: 'role',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password'] },
      offset,
      limit,
      order: [['createdAt', 'DESC']]
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
    logger.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findOne({
      where: { id },
      include: [
        {
          model: db.Role,
          as: 'role',
          attributes: ['id', 'name', 'code']
        },
        {
          model: db.Student,
          as: 'studentInfo',
          include: [
            {
              model: db.Class,
              as: 'classInfo',
              include: [{
                model: db.Department,
                as: 'department'
              }]
            }
          ]
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
};

const createUser = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { username, password, name, gender, phone, email, roleId, status = true } = req.body;

    if (!username || !password || !name || !roleId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '用户名、密码、姓名和角色不能为空'
      });
    }

    const existingUser = await db.User.findOne({ where: { username } });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    const role = await db.Role.findByPk(roleId);
    if (!role) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '角色不存在'
      });
    }

    const user = await db.User.create({
      username,
      password,
      name,
      gender: gender || '未知',
      phone,
      email,
      roleId,
      status
    }, { transaction });

    await transaction.commit();

    logger.info(`创建用户成功 - 用户名: ${username}, 角色: ${role.name}`);

    const newUser = await db.User.findOne({
      where: { id: user.id },
      include: [{
        model: db.Role,
        as: 'role',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      success: true,
      message: '创建用户成功',
      data: newUser
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('创建用户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      error: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, phone, email, roleId, status } = req.body;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (roleId && roleId !== user.roleId) {
      const role = await db.Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: '角色不存在'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (status !== undefined) updateData.status = status;

    await user.update(updateData);

    logger.info(`更新用户成功 - 用户ID: ${id}`);

    const updatedUser = await db.User.findOne({
      where: { id },
      include: [{
        model: db.Role,
        as: 'role',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: '更新用户成功',
      data: updatedUser
    });
  } catch (error) {
    logger.error('更新用户失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword = '123456' } = req.body;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await user.update({ password: newPassword });

    logger.info(`重置密码成功 - 用户ID: ${id}`);

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    logger.error('重置密码失败:', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败',
      error: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (req.user.id === parseInt(id)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '不能删除当前登录用户'
      });
    }

    await user.destroy({ transaction });

    await transaction.commit();

    logger.info(`删除用户成功 - 用户ID: ${id}, 用户名: ${user.username}`);

    res.json({
      success: true,
      message: '删除用户成功'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await db.Role.findAll({
      where: { status: true },
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    logger.error('获取角色列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取角色列表失败',
      error: error.message
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
