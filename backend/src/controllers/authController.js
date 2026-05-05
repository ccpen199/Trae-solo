const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../middleware/errorHandler');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, phone: user.phone, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const register = async (req, res, next) => {
  try {
    const { phone, password, nickname, role } = req.body;

    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return next(new BadRequestError('该手机号已被注册'));
    }

    const user = await User.create({
      phone,
      password,
      nickname: nickname || `用户${phone.slice(-4)}`,
      role: role || 'user'
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return next(new UnauthorizedError('手机号或密码错误'));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new UnauthorizedError('手机号或密码错误'));
    }

    if (user.status === 'disabled') {
      return next(new UnauthorizedError('账户已被禁用'));
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          isVerified: user.isVerified,
          balance: user.balance
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        role: user.role,
        email: user.email,
        realName: user.realName,
        isVerified: user.isVerified,
        balance: user.balance,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { nickname, avatar, gender, email, realName, idCard } = req.body;
    const user = req.user;

    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (gender !== undefined) updateData.gender = gender;
    if (email !== undefined) updateData.email = email;
    if (realName !== undefined) updateData.realName = realName;
    if (idCard !== undefined) {
      updateData.idCard = idCard;
      if (realName) {
        updateData.isVerified = true;
      }
    }

    await user.update(updateData);

    res.json({
      success: true,
      message: '更新成功',
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        role: user.role,
        email: user.email,
        realName: user.realName,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return next(new BadRequestError('原密码错误'));
    }

    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    next(error);
  }
};

const becomeLandlord = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.role === 'landlord') {
      return res.json({
        success: true,
        message: '您已经是房东',
        data: { role: user.role }
      });
    }

    if (!user.isVerified) {
      return next(new BadRequestError('请先完成实名认证'));
    }

    await user.update({ role: 'landlord' });

    res.json({
      success: true,
      message: '成功成为房东',
      data: { role: 'landlord' }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  updatePassword,
  becomeLandlord
};
