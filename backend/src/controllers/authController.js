const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { jwtSecret, jwtExpiresIn } = require('../config');
const { success, error } = require('../utils/response');
const pointsService = require('../services/pointsService');

// 用户注册
const register = async (req, res, next) => {
  try {
    const { username, password, nickname } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    
    if (existingUser) {
      return res.status(400).json(error('用户名已存在', 400));
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nickname: nickname || username,
      },
    });
    
    // 初始化积分账户（赠送100积分）
    await pointsService.addPoints(user.id, 100, '新用户注册赠送', user.id, 'SIGNUP');
    
    // 生成 token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );
    
    res.json(success({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    }, '注册成功'));
  } catch (err) {
    next(err);
  }
};

// 用户登录
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!user) {
      return res.status(401).json(error('用户名或密码错误', 401));
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(error('用户名或密码错误', 401));
    }
    
    // 生成 token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );
    
    // 获取积分余额
    const balance = await pointsService.getBalance(user.id);
    
    res.json(success({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        points: balance,
      },
    }, '登录成功'));
  } catch (err) {
    next(err);
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
      },
    });
    
    if (!user) {
      return res.status(404).json(error('用户不存在', 404));
    }
    
    // 获取积分余额
    const balance = await pointsService.getBalance(user.id);
    
    res.json(success({
      ...user,
      points: balance,
    }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
