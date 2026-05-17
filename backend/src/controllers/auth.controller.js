const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../models/db');

const sendCode = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '手机号不能为空'
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const stmt = db.prepare('INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)');
    stmt.run(phone, code, expiresAt);

    res.json({
      success: true,
      message: '验证码发送成功',
      data: { code }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发送验证码失败'
    });
  }
};

const register = async (req, res) => {
  try {
    const { phone, password, code, nickname } = req.body;

    if (!phone || !password || !code) {
      return res.status(400).json({
        success: false,
        message: '手机号、密码和验证码不能为空'
      });
    }

    const verifyStmt = db.prepare('SELECT * FROM verification_codes WHERE phone = ? AND code = ? ORDER BY created_at DESC LIMIT 1');
    const verifyCode = verifyStmt.get(phone, code);

    if (!verifyCode || new Date(verifyCode.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该手机号已注册'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userNickname = nickname || `用户${phone.slice(-4)}`;

    const stmt = db.prepare('INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)');
    const result = stmt.run(phone, hashedPassword, userNickname);

    const user = db.prepare('SELECT id, phone, nickname, avatar, bio, city, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '注册成功',
      data: { user, token }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败'
    });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password, code } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '手机号不能为空'
      });
    }

    if (code) {
      const verifyStmt = db.prepare('SELECT * FROM verification_codes WHERE phone = ? AND code = ? ORDER BY created_at DESC LIMIT 1');
      const verifyCode = verifyStmt.get(phone, code);

      if (!verifyCode || new Date(verifyCode.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          message: '验证码无效或已过期'
        });
      }

      let user = db.prepare('SELECT id, phone, nickname, avatar, bio, city, created_at FROM users WHERE phone = ?').get(phone);
      
      if (!user) {
        const userNickname = `用户${phone.slice(-4)}`;
        const stmt = db.prepare('INSERT INTO users (phone, nickname) VALUES (?, ?)');
        const result = stmt.run(phone, userNickname);
        user = db.prepare('SELECT id, phone, nickname, avatar, bio, city, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
      }

      const token = jwt.sign(
        { id: user.id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        success: true,
        message: '登录成功',
        data: { user, token }
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '密码或验证码不能为空'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '手机号或密码错误'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '手机号或密码错误'
      });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: '登录成功',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;

    if (!phone || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '手机号、验证码和新密码不能为空'
      });
    }

    const verifyStmt = db.prepare('SELECT * FROM verification_codes WHERE phone = ? AND code = ? ORDER BY created_at DESC LIMIT 1');
    const verifyCode = verifyStmt.get(phone, code);

    if (!verifyCode || new Date(verifyCode.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?');
    stmt.run(hashedPassword, phone);

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '密码重置失败'
    });
  }
};

module.exports = {
  sendCode,
  register,
  login,
  resetPassword
};
