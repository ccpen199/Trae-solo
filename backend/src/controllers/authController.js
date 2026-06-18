const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { body, validationResult } = require('express-validator');

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: '参数错误', errors: errors.array() });
  }

  try {
    const { phone, password, openid, alipayId, nickname, avatar } = req.body;

    let user;

    if (openid) {
      user = await User.findOne({ openid });
      if (!user) {
        user = await User.create({
          openid,
          nickname: nickname || `微信用户${Math.random().toString(36).slice(2, 8)}`,
          avatar,
          role: 'resident',
        });
      }
    } else if (alipayId) {
      user = await User.findOne({ alipayId });
      if (!user) {
        user = await User.create({
          alipayId,
          nickname: nickname || `支付宝用户${Math.random().toString(36).slice(2, 8)}`,
          avatar,
          role: 'resident',
        });
      }
    } else {
      user = await User.findOne({ phone }).select('+password');
      if (!user) {
        return res.status(401).json({ message: '手机号或密码错误' });
      }
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({ message: '手机号或密码错误' });
      }
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          role: user.role,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          balance: user.balance,
          ecoPoints: user.ecoPoints,
          streakDays: user.streakDays,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: '参数错误', errors: errors.array() });
  }

  try {
    const { phone, password, nickname, role = 'resident' } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: '该手机号已注册' });
    }

    const user = await User.create({
      phone,
      password,
      nickname: nickname || `用户${phone.slice(-4)}`,
      role,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          role: user.role,
          nickname: user.nickname,
          phone: user.phone,
          balance: user.balance,
          ecoPoints: user.ecoPoints,
          streakDays: user.streakDays,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: {
        id: user._id,
        role: user.role,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        balance: user.balance,
        ecoPoints: user.ecoPoints,
        streakDays: user.streakDays,
        communityId: user.communityId,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { nickname, avatar, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nickname, avatar, phone },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: {
      id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.validate = [
  body('phone').optional().isMobilePhone('zh-CN'),
  body('password').optional().isLength({ min: 6 }),
];
