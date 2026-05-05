const express = require('express');
const { body, query, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateJWT, checkPermission } = require('../middleware/auth');
const { operationLogger } = require('../middleware/logger');
const logger = require('../config/logger');

const router = express.Router();

router.use(authenticateJWT);

router.get('/',
  checkPermission('role:manage'),
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
        whereConditions.push(`(name LIKE $${paramIndex} OR code LIKE $${paramIndex})`);
        paramIndex++;
      }

      if (status !== undefined) {
        queryParams.push(parseInt(status));
        whereConditions.push(`status = $${paramIndex}`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM roles
        ${whereClause}
      `;

      const dataQuery = `
        SELECT id, name, code, description, is_system, status, created_at, updated_at
        FROM roles
        ${whereClause}
        ORDER BY sort_order ASC NULLS LAST, created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(parseInt(pageSize), offset);

      const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 1));
      const total = parseInt(countResult.rows[0].total);

      const dataResult = await pool.query(dataQuery, queryParams);

      res.json({
        success: true,
        data: {
          list: dataResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            code: row.code,
            description: row.description,
            isSystem: row.is_system,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          })),
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / pageSize)
        }
      });

    } catch (error) {
      logger.error('获取角色列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/all',
  checkPermission('role:manage'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, name, code, description, is_system, status
         FROM roles
         WHERE status = 1
         ORDER BY sort_order ASC NULLS LAST, created_at DESC`
      );

      res.json({
        success: true,
        data: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          code: row.code,
          description: row.description,
          isSystem: row.is_system,
          status: row.status
        }))
      });

    } catch (error) {
      logger.error('获取所有角色失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/:id',
  checkPermission('role:manage'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const roleResult = await pool.query(
        `SELECT id, name, code, description, is_system, status, created_at, updated_at
         FROM roles
         WHERE id = $1`,
        [id]
      );

      if (roleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        });
      }

      const permissionResult = await pool.query(
        `SELECT p.id, p.name, p.code, p.type, p.parent_id, p.path, p.icon, p.sort_order,
                p.is_hidden, p.is_root, p.depends_on, p.description
         FROM permissions p
         INNER JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = $1
         ORDER BY p.sort_order ASC`,
        [id]
      );

      const role = roleResult.rows[0];
      res.json({
        success: true,
        data: {
          id: role.id,
          name: role.name,
          code: role.code,
          description: role.description,
          isSystem: role.is_system,
          status: role.status,
          createdAt: role.created_at,
          updatedAt: role.updated_at,
          permissions: permissionResult.rows.map(p => ({
            id: p.id,
            name: p.name,
            code: p.code,
            type: p.type,
            parentId: p.parent_id,
            path: p.path,
            icon: p.icon,
            sortOrder: p.sort_order,
            isHidden: p.is_hidden,
            isRoot: p.is_root,
            dependsOn: p.depends_on,
            description: p.description
          }))
        }
      });

    } catch (error) {
      logger.error('获取角色详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.post('/',
  checkPermission('role:manage'),
  operationLogger('创建角色', '角色管理'),
  [
    body('name').notEmpty().withMessage('角色名称不能为空')
      .isLength({ max: 100 }).withMessage('角色名称长度不能超过100'),
    body('code').notEmpty().withMessage('角色编码不能为空')
      .isLength({ max: 100 }).withMessage('角色编码长度不能超过100'),
    body('description').optional().isString().withMessage('描述必须是字符串'),
    body('status').optional().isInt({ min: 0, max: 1 }).withMessage('状态值无效'),
    body('permissionIds').optional().isArray().withMessage('权限ID必须是数组')
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

      const { name, code, description, status = 1, permissionIds = [] } = req.body;

      const existingRole = await client.query(
        `SELECT id FROM roles WHERE code = $1`,
        [code]
      );

      if (existingRole.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: '角色编码已存在'
        });
      }

      const roleResult = await client.query(
        `INSERT INTO roles (name, code, description, status, is_system)
         VALUES ($1, $2, $3, $4, false)
         RETURNING id, name, code, description, status, created_at`,
        [name, code, description, status]
      );

      const roleId = roleResult.rows[0].id;

      if (permissionIds.length > 0) {
        for (const permId of permissionIds) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
            [roleId, permId]
          );
        }
      }

      await client.query('COMMIT');

      logger.info(`用户 ${req.user.username} 创建了角色: ${name} (${code})`);

      res.json({
        success: true,
        message: '角色创建成功',
        data: roleResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('创建角色失败:', error);
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
  checkPermission('role:manage'),
  operationLogger('更新角色', '角色管理'),
  [
    body('name').optional().notEmpty().withMessage('角色名称不能为空')
      .isLength({ max: 100 }).withMessage('角色名称长度不能超过100'),
    body('description').optional().isString().withMessage('描述必须是字符串'),
    body('status').optional().isInt({ min: 0, max: 1 }).withMessage('状态值无效'),
    body('permissionIds').optional().isArray().withMessage('权限ID必须是数组')
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
      const { name, description, status, permissionIds } = req.body;

      const existingRole = await client.query(
        `SELECT id, name, code, is_system FROM roles WHERE id = $1`,
        [id]
      );

      if (existingRole.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        });
      }

      const role = existingRole.rows[0];

      if (role.is_system) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: '不允许修改系统角色'
        });
      }

      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(name);
        paramIndex++;
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(description);
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
          `UPDATE roles SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          updateValues
        );
      }

      if (permissionIds !== undefined) {
        await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [id]);
        
        for (const permId of permissionIds) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
            [id, permId]
          );
        }
      }

      await client.query('COMMIT');

      logger.info(`用户 ${req.user.username} 更新了角色: ${role.name}`);

      res.json({
        success: true,
        message: '角色更新成功'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('更新角色失败:', error);
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
  checkPermission('role:manage'),
  operationLogger('删除角色', '角色管理'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingRole = await pool.query(
        `SELECT id, name, code, is_system FROM roles WHERE id = $1`,
        [id]
      );

      if (existingRole.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        });
      }

      if (existingRole.rows[0].is_system) {
        return res.status(403).json({
          success: false,
          message: '不允许删除系统角色'
        });
      }

      const userCount = await pool.query(
        `SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1`,
        [id]
      );

      if (parseInt(userCount.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          message: '该角色下存在用户，无法删除'
        });
      }

      await pool.query(`DELETE FROM roles WHERE id = $1`, [id]);

      logger.info(`用户 ${req.user.username} 删除了角色: ${existingRole.rows[0].name}`);

      res.json({
        success: true,
        message: '角色删除成功'
      });

    } catch (error) {
      logger.error('删除角色失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

module.exports = router;
