const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw new AppError('请输入用户名和密码', 400);
    }
    
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      throw new AppError('用户名或密码错误', 401);
    }
    
    if (!user.status) {
      throw new AppError('用户已被禁用，请联系管理员', 403);
    }
    
    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      throw new AppError('用户名或密码错误', 401);
    }
    
    user.lastLoginAt = new Date();
    await user.save({ fields: ['lastLoginAt'] });
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'realName', 'phone', 'email', 'role', 'status', 'lastLoginAt', 'createdAt']
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

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      throw new AppError('请输入旧密码和新密码', 400);
    }
    
    if (newPassword.length < 6) {
      throw new AppError('新密码长度不能少于6位', 400);
    }
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      throw new AppError('用户不存在', 404);
    }
    
    const isValidPassword = await user.validatePassword(oldPassword);
    
    if (!isValidPassword) {
      throw new AppError('旧密码错误', 400);
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getCurrentUser,
  changePassword,
  logout
};
