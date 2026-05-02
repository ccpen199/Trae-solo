const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'subscription_billing_jwt_secret_key_2026';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '请提供用户名和密码'
      });
    }
    
    const user = db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: '账户已被禁用'
      });
    }
    
    const userRoles = db.all(`
      SELECT r.* 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [user.id]);
    
    const userPermissions = db.all(`
      SELECT DISTINCT p.*
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ?
    `, [user.id]);
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    db.run(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), user.id, 'login', 'auth']);
    
    logger.info(`用户登录成功: ${user.username}`);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          phone: user.phone,
          roles: userRoles.map(r => ({ id: r.id, name: r.name, display_name: r.display_name })),
          permissions: userPermissions.map(p => p.name)
        }
      }
    });
  } catch (error) {
    logger.error('登录失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    db.run(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), req.user.id, 'logout', 'auth']);
    
    logger.info(`用户登出: ${req.user.username}`);
    
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    logger.error('登出失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    const userRoles = db.all(`
      SELECT r.* 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [user.id]);
    
    const userPermissions = db.all(`
      SELECT DISTINCT p.*
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ?
    `, [user.id]);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          phone: user.phone,
          status: user.status,
          created_at: user.created_at
        },
        roles: userRoles.map(r => ({ id: r.id, name: r.name, display_name: r.display_name })),
        permissions: userPermissions.map(p => ({
          id: p.id,
          name: p.name,
          display_name: p.display_name,
          category: p.category
        }))
      }
    });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '请提供旧密码和新密码'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: '新密码长度至少6位'
      });
    }
    
    const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    const isPasswordValid = bcrypt.compareSync(oldPassword, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '旧密码错误'
      });
    }
    
    const newPasswordHash = bcrypt.hashSync(newPassword, 10);
    
    db.run(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newPasswordHash, req.user.id]);
    
    db.run(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), req.user.id, 'change_password', 'auth']);
    
    logger.info(`用户修改密码: ${req.user.username}`);
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    logger.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;
