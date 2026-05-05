const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email || null, phone || null]
    );

    const newUser = await pool.query(
      'SELECT id, username, email, phone, role FROM users WHERE id = ?',
      [result.lastInsertRowid]
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, phone, address, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { email, phone, address } = req.body;
    const userId = req.user.id;

    await pool.query(
      'UPDATE users SET email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [email || null, phone || null, address || null, userId]
    );

    const result = await pool.query(
      'SELECT id, username, email, phone, address, role FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '个人资料更新成功',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '旧密码和新密码不能为空' });
    }

    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: '旧密码错误' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword
};
