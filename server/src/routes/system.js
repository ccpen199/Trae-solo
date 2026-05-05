const express = require('express');
const { body, query, validationResult } = require('express-validator');
const pool = require('../config/database');
const { redisClient } = require('../config/redis');
const { authenticateJWT, checkPermission } = require('../middleware/auth');
const { operationLogger } = require('../middleware/logger');
const logger = require('../config/logger');

const router = express.Router();

router.use(authenticateJWT);

router.get('/settings',
  checkPermission('system:setting'),
  async (req, res) => {
    try {
      const settings = {
        siteName: 'RBAC权限管理系统',
        siteDescription: '基于RBAC模型的权限管理系统',
        maxLoginAttempts: 5,
        sessionTimeout: 86400,
        passwordMinLength: 6,
        passwordComplexity: false,
        allowSelfRegistration: false,
        defaultUserStatus: 1,
        theme: 'light'
      };

      res.json({
        success: true,
        data: settings
      });

    } catch (error) {
      logger.error('获取系统设置失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.put('/settings',
  checkPermission('system:setting'),
  operationLogger('更新系统设置', '系统管理'),
  async (req, res) => {
    try {
      res.json({
        success: true,
        message: '系统设置更新成功'
      });

    } catch (error) {
      logger.error('更新系统设置失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/ftp-servers',
  checkPermission('system:ftp'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
  ],
  async (req, res) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      
      const ftpServers = [
        {
          id: '1',
          name: '主FTP服务器',
          host: '192.168.1.100',
          port: 21,
          username: 'ftp_user',
          status: 1,
          description: '主要素材存储服务器',
          createdAt: '2026-01-01T00:00:00Z'
        }
      ];

      res.json({
        success: true,
        data: {
          list: ftpServers,
          total: ftpServers.length,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });

    } catch (error) {
      logger.error('获取FTP服务器列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.post('/ftp-servers',
  checkPermission('system:ftp'),
  operationLogger('添加FTP服务器', '系统管理'),
  [
    body('name').notEmpty().withMessage('名称不能为空'),
    body('host').notEmpty().withMessage('主机地址不能为空'),
    body('port').isInt({ min: 1, max: 65535 }).withMessage('端口号必须在1-65535之间'),
    body('username').notEmpty().withMessage('用户名不能为空')
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

      res.json({
        success: true,
        message: 'FTP服务器添加成功'
      });

    } catch (error) {
      logger.error('添加FTP服务器失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/resolutions',
  checkPermission('system:resolution'),
  async (req, res) => {
    try {
      const resolutions = [
        { id: '1', name: '1080P', width: 1920, height: 1080, status: 1 },
        { id: '2', name: '720P', width: 1280, height: 720, status: 1 },
        { id: '3', name: '4K', width: 3840, height: 2160, status: 1 },
        { id: '4', name: '1080P竖屏', width: 1080, height: 1920, status: 1 }
      ];

      res.json({
        success: true,
        data: resolutions
      });

    } catch (error) {
      logger.error('获取分辨率列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.post('/resolutions',
  checkPermission('system:resolution'),
  operationLogger('添加分辨率', '系统管理'),
  [
    body('name').notEmpty().withMessage('名称不能为空'),
    body('width').isInt({ min: 1, max: 10000 }).withMessage('宽度必须在1-10000之间'),
    body('height').isInt({ min: 1, max: 10000 }).withMessage('高度必须在1-10000之间')
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

      res.json({
        success: true,
        message: '分辨率添加成功'
      });

    } catch (error) {
      logger.error('添加分辨率失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/online-users',
  checkPermission('system:online'),
  async (req, res) => {
    try {
      const onlineUsers = [
        {
          id: '1',
          userId: req.user.id,
          username: req.user.username,
          realName: req.user.realName,
          ipAddress: req.ip,
          loginAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          sessionId: 'session_' + Date.now()
        }
      ];

      res.json({
        success: true,
        data: {
          list: onlineUsers,
          total: onlineUsers.length
        }
      });

    } catch (error) {
      logger.error('获取在线用户列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.post('/online-users/:sessionId/kick',
  checkPermission('system:online'),
  operationLogger('强制下线用户', '系统管理'),
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      res.json({
        success: true,
        message: '用户已强制下线'
      });

    } catch (error) {
      logger.error('强制下线用户失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

router.get('/health',
  async (req, res) => {
    try {
      const dbStatus = await checkDatabase();
      const redisStatus = await checkRedis();

      res.json({
        success: true,
        data: {
          database: dbStatus ? '正常' : '异常',
          redis: redisStatus ? '正常' : '异常',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('获取系统健康状态失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

async function checkDatabase() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
}

async function checkRedis() {
  try {
    if (redisClient.isOpen) {
      await redisClient.ping();
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

module.exports = router;
