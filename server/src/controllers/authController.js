const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Role, Permission } = require('../models');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数验证失败', errors: errors.array() });
    }

    const { username, email, phone, password, nickname } = req.body;

    const existingUser = await User.findOne({
      where: {
        username
      }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: '邮箱已被注册' });
      }
    }

    const user = await User.create({
      username,
      email,
      phone,
      password,
      nickname: nickname || username,
      user_type: 'member',
      status: 'pending'
    });

    const memberRole = await Role.findOne({ where: { code: 'member' } });
    if (memberRole) {
      await user.addRole(memberRole);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const userWithoutPassword = { ...user.toJSON() };
    delete userWithoutPassword.password;

    res.status(201).json({
      success: true,
      message: '注册成功，请等待审核',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数验证失败', errors: errors.array() });
    }

    const { username, password } = req.body;

    const user = await User.findOne({
      where: { username },
      include: [{ model: Role, include: [Permission] }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ success: false, message: '账户待审核，请联系管理员' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: '账户未激活' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: '账户已被禁用' });
    }

    user.last_login_at = new Date();
    user.last_login_ip = req.ip || req.connection.remoteAddress;
    await user.save();

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const userWithoutPassword = { ...user.toJSON() };
    delete userWithoutPassword.password;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userWithoutPassword = { ...req.user.toJSON() };
    delete userWithoutPassword.password;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nickname, email, phone, avatar } = req.body;

    const updateData = {};
    if (nickname) updateData.nickname = nickname;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;

    await req.user.update(updateData);

    const userWithoutPassword = { ...req.user.toJSON() };
    delete userWithoutPassword.password;

    res.json({
      success: true,
      message: '更新成功',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数验证失败', errors: errors.array() });
    }

    const { oldPassword, newPassword } = req.body;

    const isValidPassword = await req.user.validatePassword(oldPassword);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: '原密码错误' });
    }

    await req.user.update({ password: newPassword });

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};