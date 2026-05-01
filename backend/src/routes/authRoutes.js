const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken, authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, email, phone, nickname, role } = req.body;
    
    if (!username || !password) {
      throw new AppError('用户名和密码不能为空', 400);
    }
    
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new AppError('用户名已存在', 400);
    }
    
    const allowedRoles = ['reader', 'operator', 'algorithm', 'advertiser'];
    const userRole = allowedRoles.includes(role) ? role : 'reader';
    
    const user = await User.create({
      username,
      password,
      email,
      phone,
      nickname: nickname || username,
      role: userRole
    });
    
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw new AppError('用户名和密码不能为空', 400);
    }
    
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      throw new AppError('用户名或密码错误', 401);
    }
    
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      throw new AppError('用户名或密码错误', 401);
    }
    
    if (user.status !== 'active') {
      throw new AppError('账户已被禁用', 403);
    }
    
    await user.update({
      lastLoginAt: new Date(),
      lastLoginIp: req.ip || req.connection.remoteAddress
    });
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const { nickname, email, phone, avatar } = req.body;
    
    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    
    await user.update(updateData);
    
    res.json({
      success: true,
      message: '个人信息更新成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/password', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      throw new AppError('旧密码和新密码不能为空', 400);
    }
    
    const isPasswordValid = await user.validatePassword(oldPassword);
    
    if (!isPasswordValid) {
      throw new AppError('旧密码错误', 400);
    }
    
    await user.update({ password: newPassword });
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
