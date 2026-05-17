const db = require('../models/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const { username, password, nickname } = req.body;

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)'
    ).run(username, hashedPassword, nickname || username);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const user = db.prepare('SELECT id, username, nickname, avatar, bio, balance FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      data: {
        token,
        user
      },
      message: '注册成功'
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const { username, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userInfo } = user;

    res.json({
      success: true,
      data: {
        token,
        user: userInfo
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getProfile = (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, nickname, avatar, bio, balance, created_at FROM users WHERE id = ?').get(req.user.id);
    
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
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const updateProfile = (req, res) => {
  const { nickname, avatar, bio } = req.body;

  try {
    db.prepare(
      'UPDATE users SET nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar), bio = COALESCE(?, bio), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(nickname, avatar, bio, req.user.id);

    const user = db.prepare('SELECT id, username, nickname, avatar, bio, balance FROM users WHERE id = ?').get(req.user.id);

    res.json({
      success: true,
      data: user,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
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
  updateProfile
};
