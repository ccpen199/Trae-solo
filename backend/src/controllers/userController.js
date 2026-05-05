const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query, getClient } = require('../config/database');
const { logOperation } = require('../middlewares/log');

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;

    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: '账号已被禁用，请联系管理员' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await logOperation(req, 'login', 'system', user.id, user.username, 'success', '登录成功');

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          real_name: user.real_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户信息失败' 
    });
  }
};

const updateCurrentUserInfo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const { real_name, email, phone } = req.body;
    const userId = req.user.id;

    const result = await query(
      `UPDATE users 
       SET real_name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, username, real_name, email, phone, role, status`,
      [real_name, email, phone, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    res.json({
      success: true,
      message: '个人信息修改成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update user info error:', error);
    res.status(500).json({ 
      success: false, 
      message: '修改个人信息失败' 
    });
  }
};

const updateCurrentUserPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const { old_password, new_password } = req.body;
    const userId = req.user.id;

    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    const isPasswordValid = await bcrypt.compare(old_password, userResult.rows[0].password);

    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: '原密码错误' 
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ 
      success: false, 
      message: '修改密码失败' 
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, page_size = 10, username, real_name, role, status } = req.query;
    const offset = (page - 1) * page_size;

    let queryText = 'SELECT id, username, real_name, email, phone, role, status, created_at, updated_at FROM users WHERE 1=1';
    let queryParams = [];
    let paramIndex = 1;

    if (username) {
      queryText += ` AND username LIKE $${paramIndex}`;
      queryParams.push(`%${username}%`);
      paramIndex++;
    }

    if (real_name) {
      queryText += ` AND real_name LIKE $${paramIndex}`;
      queryParams.push(`%${real_name}%`);
      paramIndex++;
    }

    if (role) {
      queryText += ` AND role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    const countResult = await query(queryText.replace('SELECT id, username, real_name, email, phone, role, status, created_at, updated_at', 'SELECT COUNT(*)'), queryParams);
    const total = parseInt(countResult.rows[0].count);

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(page_size), offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / page_size)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户列表失败' 
    });
  }
};

const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const { username, password, real_name, email, phone, role, status } = req.body;

    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (username, password, real_name, email, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, real_name, email, phone, role, status`,
      [username, hashedPassword, real_name, email, phone, role || 'user', status || 'active']
    );

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建用户失败' 
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const userId = parseInt(req.params.id);
    const { real_name, email, phone, role, status } = req.body;

    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    const result = await query(
      `UPDATE users 
       SET real_name = $1, email = $2, phone = $3, role = $4, status = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, username, real_name, email, phone, role, status`,
      [real_name, email, phone, role, status, userId]
    );

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新用户信息失败' 
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: '不能删除自己的账号' 
      });
    }

    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: '删除用户失败' 
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const result = await query(
      'SELECT id, username, real_name, email, phone, role, status, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户信息失败' 
    });
  }
};

module.exports = {
  login,
  getCurrentUser,
  updateCurrentUserInfo,
  updateCurrentUserPassword,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById
};