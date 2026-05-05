const express = require('express');
const { query, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateJWT, checkPermission } = require('../middleware/auth');
const { operationLogger } = require('../middleware/logger');
const logger = require('../config/logger');

const router = express.Router();

router.use(authenticateJWT);

router.get('/',
  checkPermission('log:view'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('keyword').optional().isString().withMessage('关键词必须是字符串'),
    query('module').optional().isString().withMessage('模块必须是字符串'),
    query('status').optional().isInt({ min: 0, max: 1 }).withMessage('状态值无效'),
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确')
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

      const { 
        page = 1, pageSize = 10, keyword, module, 
        status, startDate, endDate 
      } = req.query;
      const offset = (page - 1) * pageSize;

      let queryParams = [];
      let whereConditions = [];
      let paramIndex = 1;

      if (keyword) {
        queryParams.push(`%${keyword}%`);
        whereConditions.push(`(username LIKE $${paramIndex} OR action LIKE $${paramIndex} OR description LIKE $${paramIndex})`);
        paramIndex++;
      }

      if (module) {
        queryParams.push(module);
        whereConditions.push(`module = $${paramIndex}`);
        paramIndex++;
      }

      if (status !== undefined) {
        queryParams.push(parseInt(status));
        whereConditions.push(`status = $${paramIndex}`);
        paramIndex++;
      }

      if (startDate) {
        queryParams.push(startDate);
        whereConditions.push(`created_at >= $${paramIndex}`);
        paramIndex++;
      }

      if (endDate) {
        queryParams.push(endDate + ' 23:59:59');
        whereConditions.push(`created_at <= $${paramIndex}`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM operation_logs
        ${whereClause}
      `;

      const dataQuery = `
        SELECT id, user_id, username, action, module, description, 
               ip_address, user_agent, request_method, request_url, 
               status, created_at
        FROM operation_logs
        ${whereClause}
        ORDER BY created_at DESC
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
            userId: row.user_id,
            username: row.username,
            action: row.action,
            module: row.module,
            description: row.description,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            requestMethod: row.request_method,
            requestUrl: row.request_url,
            status: row.status,
            createdAt: row.created_at
          })),
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / pageSize)
        }
      });

    } catch (error) {
      logger.error('获取日志列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/modules',
  checkPermission('log:view'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT DISTINCT module 
         FROM operation_logs 
         WHERE module IS NOT NULL 
         ORDER BY module`
      );

      res.json({
        success: true,
        data: result.rows.map(row => row.module)
      });

    } catch (error) {
      logger.error('获取日志模块列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/:id',
  checkPermission('log:view'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT id, user_id, username, action, module, description, 
                ip_address, user_agent, request_method, request_url, 
                status, created_at
         FROM operation_logs
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '日志不存在'
        });
      }

      const row = result.rows[0];
      res.json({
        success: true,
        data: {
          id: row.id,
          userId: row.user_id,
          username: row.username,
          action: row.action,
          module: row.module,
          description: row.description,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          requestMethod: row.request_method,
          requestUrl: row.request_url,
          status: row.status,
          createdAt: row.created_at
        }
      });

    } catch (error) {
      logger.error('获取日志详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/export/data',
  checkPermission('log:export'),
  operationLogger('导出日志', '日志管理'),
  [
    query('keyword').optional().isString().withMessage('关键词必须是字符串'),
    query('module').optional().isString().withMessage('模块必须是字符串'),
    query('status').optional().isInt({ min: 0, max: 1 }).withMessage('状态值无效'),
    query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式不正确')
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

      const { keyword, module, status, startDate, endDate } = req.query;

      let queryParams = [];
      let whereConditions = [];
      let paramIndex = 1;

      if (keyword) {
        queryParams.push(`%${keyword}%`);
        whereConditions.push(`(username LIKE $${paramIndex} OR action LIKE $${paramIndex} OR description LIKE $${paramIndex})`);
        paramIndex++;
      }

      if (module) {
        queryParams.push(module);
        whereConditions.push(`module = $${paramIndex}`);
        paramIndex++;
      }

      if (status !== undefined) {
        queryParams.push(parseInt(status));
        whereConditions.push(`status = $${paramIndex}`);
        paramIndex++;
      }

      if (startDate) {
        queryParams.push(startDate);
        whereConditions.push(`created_at >= $${paramIndex}`);
        paramIndex++;
      }

      if (endDate) {
        queryParams.push(endDate + ' 23:59:59');
        whereConditions.push(`created_at <= $${paramIndex}`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const result = await pool.query(
        `SELECT username, action, module, description, ip_address, 
                request_method, request_url, status, created_at
         FROM operation_logs
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT 10000`,
        queryParams
      );

      res.json({
        success: true,
        message: '日志导出数据获取成功',
        data: {
          total: result.rows.length,
          list: result.rows.map(row => ({
            username: row.username,
            action: row.action,
            module: row.module,
            description: row.description,
            ipAddress: row.ip_address,
            requestMethod: row.request_method,
            requestUrl: row.request_url,
            status: row.status === 1 ? '成功' : '失败',
            createdAt: row.created_at
          }))
        }
      });

    } catch (error) {
      logger.error('导出日志失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

module.exports = router;
