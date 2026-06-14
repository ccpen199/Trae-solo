const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res, next) => {
  try {
    const { username, password, role, phone, companyName, contact, address, province, city, district } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '用户名、密码和角色为必填项'
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '用户名已存在'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      role,
      phone,
      companyName,
      contact,
      address,
      province,
      city,
      district,
      isVerified: false,
      verifyStatus: 'pending'
    });

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      data: userData,
      message: '注册成功'
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '用户名和密码为必填项'
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: '用户名或密码错误'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        message: '用户名或密码错误'
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      data: {
        token,
        user: userData
      },
      message: '登录成功'
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: null,
      message: '登出成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout
};
