const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');
const { operationLogger } = require('../middleware/logger');
const logger = require('../config/logger');
require('dotenv').config();

const router = express.Router();

router.post('/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
  ],
  operationLogger('登录', '认证'),
  async (req, res) => {
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

      const userResult = await pool.query(
        `SELECT u.*, 
                array_agg(DISTINCT r.code) as roles,
                array_agg(DISTINCT p.code) as permissions
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         LEFT JOIN role_permissions rp ON r.id = rp.role_id
         LEFT JOIN permissions p ON rp.permission_id = p.id
         WHERE u.username = $1
         GROUP BY u.id`,
        [username]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      const user = userResult.rows[0];

      if (user.status !== 1) {
        return res.status(403).json({
          success: false,
          message: '用户已被禁用，请联系管理员'
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
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      await pool.query(
        `UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [user.id]
      );

      const userRoles = user.roles.filter(r => r !== null);
      const userPermissions = user.permissions.filter(p => p !== null);
      const isRoot = userRoles.includes('root') || userPermissions.includes('root');

      logger.info(`用户 ${username} 登录成功，角色: ${userRoles.join(', ')}`);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            realName: user.real_name,
            email: user.email,
            phone: user.phone,
            roles: userRoles,
            permissions: userPermissions,
            isRoot,
            lastLoginAt: user.last_login_at
          }
        }
      });

    } catch (error) {
      logger.error('登录失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.post('/logout', authenticateJWT, operationLogger('登出', '认证'), (req, res) => {
  logger.info(`用户 ${req.user.username} 登出`);
  res.json({
    success: true,
    message: '登出成功'
  });
});

router.get('/current', authenticateJWT, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT u.*, 
              array_agg(DISTINCT r.code) as roles,
              array_agg(DISTINCT r.name) as role_names,
              array_agg(DISTINCT p.code) as permissions
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = userResult.rows[0];
    const userRoles = user.roles.filter(r => r !== null);
    const userPermissions = user.permissions.filter(p => p !== null);
    const isRoot = userRoles.includes('root') || userPermissions.includes('root');

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles: userRoles,
        roleNames: user.role_names.filter(n => n !== null),
        permissions: userPermissions,
        isRoot,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    });

  } catch (error) {
    logger.error('获取当前用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/change-password',
  authenticateJWT,
  [
    body('oldPassword').notEmpty().withMessage('原密码不能为空'),
    body('newPassword').notEmpty().withMessage('新密码不能为空')
      .isLength({ min: 6 }).withMessage('新密码长度至少6位')
  ],
  operationLogger('修改密码', '认证'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
      }

      const { oldPassword, newPassword } = req.body;

      const userResult = await pool.query(
        `SELECT password FROM users WHERE id = $1`,
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, userResult.rows[0].password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '原密码错误'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [hashedPassword, req.user.id]
      );

      logger.info(`用户 ${req.user.username} 修改密码成功`);

      res.json({
        success: true,
        message: '密码修改成功'
      });

    } catch (error) {
      logger.error('修改密码失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

module.exports = router;
