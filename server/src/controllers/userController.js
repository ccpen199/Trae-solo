require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const register = async (req, res) => {
  try {
    const { username, password, email, phone, userType, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: email || null }, { phone: phone || null }]
      }
    });

    if (existingUser) {
      let conflictField = '用户名';
      if (existingUser.email === email) conflictField = '邮箱';
      if (existingUser.phone === phone) conflictField = '手机号';
      
      return res.status(400).json({
        success: false,
        message: `${conflictField}已被注册`
      });
    }

    const user = await User.create({
      username,
      password,
      email,
      phone,
      userType: userType || 'pregnant',
      nickname: nickname || username
    });

    const token = generateToken(user);

    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: username }, { phone: username }]
      }
    });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);

    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userData = req.user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nickname, avatar, bio, userType, dueDate, pregnancyWeek, babyAge } = req.body;

    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (userType !== undefined) updateData.userType = userType;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (pregnancyWeek !== undefined) updateData.pregnancyWeek = pregnancyWeek;
    if (babyAge !== undefined) updateData.babyAge = babyAge;

    await req.user.update(updateData);

    const userData = req.user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: '更新成功',
      data: userData
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空'
      });
    }

    if (!(await req.user.validatePassword(oldPassword))) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    req.user.password = newPassword;
    await req.user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
