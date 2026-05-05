const { validationResult, body, query, param } = require('express-validator');
const UserService = require('../services/user.service');
const AuditLogService = require('../services/auditLog.service');
const { getClientIP } = require('../middlewares/ipBlacklist');
const logger = require('../utils/logger');

const validateCreateUser = [
  body('userNo').notEmpty().withMessage('用户编号不能为空'),
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
  body('name').notEmpty().withMessage('姓名不能为空')
];

const validateUpdateUser = [
  param('id').notEmpty().withMessage('用户ID不能为空')
];

async function getList(req, res) {
  try {
    const { page, pageSize, keyword, userNo, username, name, orgId, status } = req.query;
    
    const result = await UserService.getList({
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      keyword,
      userNo,
      username,
      name,
      orgId,
      status
    });
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result
    });
  } catch (err) {
    logger.error('获取用户列表失败:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const user = await UserService.getById(id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }
    
    const result = {
      ...user,
      password: undefined,
      roles: user.userRoles?.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code
      })) || []
    };
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result
    });
  } catch (err) {
    logger.error('获取用户详情失败:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
}

async function create(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg,
        data: null
      });
    }
    
    const { userNo, username, password, name, email, phone, avatar, status, orgId, roleIds } = req.body;
    const ip = getClientIP(req);
    
    const result = await UserService.create({
      userNo,
      username,
      password,
      name,
      email,
      phone,
      avatar,
      status,
      orgId,
      roleIds
    });
    
    await AuditLogService.log({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'create',
      module: 'user',
      ip,
      userAgent: req.headers['user-agent'],
      requestData: { userNo, username, name, email, phone, orgId, roleIds },
      status: result.success ? 1 : 0,
      message: result.success ? '创建用户成功' : result.message
    });
    
    if (!result.success) {
      return res.status(400).json({
        code: 400,
        message: result.message,
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '创建成功',
      data: result.data
    });
  } catch (err) {
    logger.error('创建用户失败:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
}

async function update(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: errors.array()[0].msg,
        data: null
      });
    }
    
    const { id } = req.params;
    const { userNo, username, password, name, email, phone, avatar, status, orgId, roleIds } = req.body;
    const ip = getClientIP(req);
    
    const result = await UserService.update(id, {
      userNo,
      username,
      password,
      name,
      email,
      phone,
      avatar,
      status,
      orgId,
      roleIds
    });
    
    await AuditLogService.log({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'update',
      module: 'user',
      ip,
      userAgent: req.headers['user-agent'],
      requestData: { id, userNo, username, name, email, phone, orgId, roleIds },
      status: result.success ? 1 : 0,
      message: result.success ? '更新用户成功' : result.message
    });
    
    if (!result.success) {
      return res.status(400).json({
        code: 400,
        message: result.message,
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '更新成功',
      data: result.data
    });
  } catch (err) {
    logger.error('更新用户失败:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const ip = getClientIP(req);
    
    const result = await UserService.delete(id);
    
    await AuditLogService.log({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'delete',
      module: 'user',
      ip,
      userAgent: req.headers['user-agent'],
      requestData: { id },
      status: result.success ? 1 : 0,
      message: result.success ? '删除用户成功' : result.message
    });
    
    if (!result.success) {
      return res.status(400).json({
        code: 400,
        message: result.message,
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (err) {
    logger.error('删除用户失败:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
}

async function batchDelete(req, res) {
  try {
    const { ids } = req.body;
    const ip = getClientIP(req);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要删除的用户',
        data: null
      });
    }
    
    const result = await UserService.batchDelete(ids);
    
    await AuditLogService.log({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'batchDelete',
      module: 'user',
      ip,
      userAgent: req.headers['user-agent'],
      requestData: { ids },
      status: result.success ? 1 : 0,
      message: result.success ? `批量删除${ids.length}个用户成功` : '批量删除失败'
    });
    
    res.json({
      code: 200,
      message: '批量删除成功',
      data: null
    });
  } catch (err) {
    logger.error('批量删除用户失败:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const ip = getClientIP(req);
    
    if (!newPassword) {
      return res.status(400).json({
        code: 400,
        message: '新密码不能为空',
        data: null
      });
    }
    
    const result = await UserService.resetPassword(id, newPassword);
    
    await AuditLogService.log({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'resetPassword',
      module: 'user',
      ip,
      userAgent: req.headers['user-agent'],
      requestData: { id },
      status: result.success ? 1 : 0,
      message: result.success ? '重置密码成功' : result.message
    });
    
    if (!result.success) {
      return res.status(400).json({
        code: 400,
        message: result.message,
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '重置密码成功',
      data: null
    });
  } catch (err) {
    logger.error('重置密码失败:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
}

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  getList,
  getById,
  create,
  update,
  remove,
  batchDelete,
  resetPassword
};
