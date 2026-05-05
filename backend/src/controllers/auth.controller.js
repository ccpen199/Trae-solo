const { validationResult, body } = require('express-validator');
const AuthService = require('../services/auth.service');
const AuditLogService = require('../services/auditLog.service');
const { getClientIP } = require('../middlewares/ipBlacklist');
const logger = require('../utils/logger');

const validateLogin = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
];

async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg,
        data: null
      });
    }
    
    const { username, password } = req.body;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'];
    
    const result = await AuthService.login({ username, password, ip, userAgent });
    
    await AuditLogService.log({
      userId: result.success ? result.data.user.id : null,
      username,
      action: 'login',
      module: 'auth',
      ip,
      userAgent,
      requestData: { username },
      status: result.success ? 1 : 0,
      message: result.success ? '登录成功' : result.message
    });
    
    if (!result.success) {
      return res.status(401).json({
        code: 401,
        message: result.message,
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '登录成功',
      data: result.data
    });
  } catch (err) {
    logger.error('登录失败:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
}

async function logout(req, res) {
  try {
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'];
    
    if (req.user) {
      await AuditLogService.log({
        userId: req.user.id,
        username: req.user.username,
        action: 'logout',
        module: 'auth',
        ip,
        userAgent,
        status: 1,
        message: '退出登录'
      });
    }
    
    res.json({
      code: 200,
      message: '退出成功',
      data: null
    });
  } catch (err) {
    logger.error('退出登录失败:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
}

async function getUserInfo(req, res) {
  try {
    const userInfo = await AuthService.getUserInfo(req.user.id);
    
    if (!userInfo) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: userInfo
    });
  } catch (err) {
    logger.error('获取用户信息失败:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
}

module.exports = {
  validateLogin,
  login,
  logout,
  getUserInfo
};
