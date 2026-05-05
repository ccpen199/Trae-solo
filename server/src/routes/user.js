const express = require('express');
const bcrypt = require('bcryptjs');
const { body, query, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateJWT, checkPermission } = require('../middleware/auth');
const { operationLogger } = require('../middleware/logger');
const logger = require('../config/logger');

const router = express.Router();

router.use(authenticateJWT);

router.get('/',
  checkPermission('user:manage'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('keyword').optional().isString().withMessage('关键词必须是字符串'),
    query('status').optional().isInt({ min: 0, max: 1 }).withMessage('状态值无效')
  ],
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

      const { page = 1, pageSize = 10, keyword, status } = req.query;
      const offset = (page - 1) * pageSize;

      let queryParams = [];
      let whereConditions = [];
      let paramIndex = 1;

      if (keyword) {
        queryParams.push(`%${keyword}%`);
        whereConditions.push(`(u.username LIKE $${paramIndex} OR u.real_name LIKE $${paramIndex})`);
        paramIndex++;
      }

      if (status !== undefined) {
        queryParams.push(parseInt(status));
        whereConditions.push(`u.status = $${paramIndex}`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM users u
        ${whereClause}
      `;

      const dataQuery = `
        SELECT u.id, u.username, u.real_name, u.email, u.phone, u.status, 
               u.created_at, u.updated_at, u.last_login_at,
               array_agg(DISTINCT r.id) as role_ids,
               array_agg(DISTINCT r.name) as role_names
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ${whereClause}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(parseInt(pageSize), offset);

      const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 1));
      const total = parseInt(countResult.rows[0].total);

      const dataResult = await pool.query(dataQuery, queryParams);

      const users = dataResult.rows.map(row => ({
        id: row.id,
        username: row.username,
        realName: row.real_name,
        email: row.email,
        phone: row.phone,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at,
        roles: row.role_ids.filter(id => id !== null).map((id, index) => ({
          id,
          name: row.role_names[index]
        }))
      }));

      res.json({
        success: true,
        data: {
          list: users,
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / pageSize)
        }
      });

    } catch (error) {
      logger.error('获取用户列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/:id',
  checkPermission('user:manage'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const userResult = await pool.query(
        `SELECT u.id, u.username, u.real_name, u.email, u.phone, u.status, 
                u.created_at, u.updated_at, u.last_login_at,
                array_agg(DISTINCT r.id) as role_ids,
                array_agg(DISTINCT r.name) as role_names,
                array_agg(DISTINCT r.code) as role_codes
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         WHERE u.id = $1
         GROUP BY u.id`,
        [id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const row = userResult.rows[0];
      const user = {
        id: row.id,
        username: row.username,
        realName: row.real_name,
        email: row.email,
        phone: row.phone,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at,
        roles: row.role_ids.filter(id => id !== null).map((id, index) => ({
          id,
          name: row.role_names[index],
          code: row.role_codes[index]
        }))
      };

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      logger.error('获取用户详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.post('/',
  checkPermission('user:manage'),
  operationLogger('创建用户', '用户管理'),
  [
    body('username').notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50之间'),
    body('password').notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6 }).withMessage('密码长度至少6位'),
    body('realName').optional().isString().withMessage('真实姓名必须是字符串'),
    body('email').optional().isEmail().withMessage('邮箱格式不正确'),
    body('phone').optional().isString().withMessage('手机号必须是字符串'),
    body('status').optional().isInt({ min: 0, max: 1 }).withMessage('状态值无效'),
    body('roleIds').optional().isArray().withMessage('角色ID必须是数组')
  ],
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
      }

      const { username, password, realName, email, phone, status = 1, roleIds = [] } = req.body;

      const existingUser = await client.query(
        `SELECT id FROM users WHERE username = $1`,
        [username]
      );

      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const userResult = await client.query(
        `INSERT INTO users (username, password, real_name, email, phone, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, username, real_name, email, phone, status, created_at`,
        [username, hashedPassword, realName, email, phone, status]
      );

      const userId = userResult.rows[0].id;

      if (roleIds.length > 0) {
        for (const roleId of roleIds) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
            [userId, roleId]
          );
        }
      }

      await client.query('COMMIT');

      logger.info(`用户 ${req.user.username} 创建了新用户: ${username}`);

      res.json({
        success: true,
        message: '用户创建成功',
        data: userResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('创建用户失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    } finally {
      client.release();
    }
  }
);

router.put('/:id',
  checkPermission('user:manage'),
  operationLogger('更新用户', '用户管理'),
  [
    body('realName').optional().isString().withMessage('真实姓名必须是字符串'),
    body('email').optional().isEmail().withMessage('邮箱格式不正确'),
    body('phone').optional().isString().withMessage('手机号必须是字符串'),
    body('status').optional().isInt({ min: 0, max: 1 }).withMessage('状态值无效'),
    body('roleIds').optional().isArray().withMessage('角色ID必须是数组')
  ],
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { realName, email, phone, status, roleIds } = req.body;

      const existingUser = await client.query(
        `SELECT id, username FROM users WHERE id = $1`,
        [id]
      );

      if (existingUser.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      if (existingUser.rows[0].username === 'root') {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: '不允许修改root用户'
        });
      }

      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (realName !== undefined) {
        updateFields.push(`real_name = $${paramIndex}`);
        updateValues.push(realName);
        paramIndex++;
      }
      if (email !== undefined) {
        updateFields.push(`email = $${paramIndex}`);
        updateValues.push(email);
        paramIndex++;
      }
      if (phone !== undefined) {
        updateFields.push(`phone = $${paramIndex}`);
        updateValues.push(phone);
        paramIndex++;
      }
      if (status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(status);
        paramIndex++;
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id);

        await client.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          updateValues
        );
      }

      if (roleIds !== undefined) {
        await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);
        
        for (const roleId of roleIds) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
            [id, roleId]
          );
        }
      }

      await client.query('COMMIT');

      logger.info(`用户 ${req.user.username} 更新了用户: ${existingUser.rows[0].username}`);

      res.json({
        success: true,
        message: '用户更新成功'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('更新用户失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    } finally {
      client.release();
    }
  }
);

router.delete('/:id',
  checkPermission('user:manage'),
  operationLogger('删除用户', '用户管理'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingUser = await pool.query(
        `SELECT id, username FROM users WHERE id = $1`,
        [id]
      );

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      if (existingUser.rows[0].username === 'root') {
        return res.status(403).json({
          success: false,
          message: '不允许删除root用户'
        });
      }

      await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

      logger.info(`用户 ${req.user.username} 删除了用户: ${existingUser.rows[0].username}`);

      res.json({
        success: true,
        message: '用户删除成功'
      });

    } catch (error) {
      logger.error('删除用户失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.put('/:id/reset-password',
  checkPermission('user:manage'),
  operationLogger('重置密码', '用户管理'),
  [
    body('password').notEmpty().withMessage('新密码不能为空')
      .isLength({ min: 6 }).withMessage('新密码长度至少6位')
  ],
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

      const { id } = req.params;
      const { password } = req.body;

      const existingUser = await pool.query(
        `SELECT id, username FROM users WHERE id = $1`,
        [id]
      );

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [hashedPassword, id]
      );

      logger.info(`用户 ${req.user.username} 重置了用户 ${existingUser.rows[0].username} 的密码`);

      res.json({
        success: true,
        message: '密码重置成功'
      });

    } catch (error) {
      logger.error('重置密码失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

module.exports = router;
