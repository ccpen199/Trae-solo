const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const register = async (req, res) => {
  try {
    const { username, email, password, nickname } = req.body;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      nickname: nickname || username
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        },
        token
      },
      message: '注册成功'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名/邮箱和密码'
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      });
    }

    await user.update({ lastLoginAt: new Date() });

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role
        },
        token
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nickname, avatar, bio } = req.body;

    await req.user.update({
      nickname,
      avatar,
      bio
    });

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          nickname: req.user.nickname,
          avatar: req.user.avatar,
          bio: req.user.bio,
          role: req.user.role
        }
      },
      message: '更新成功'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '密码修改失败'
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
