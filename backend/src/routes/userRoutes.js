const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { createLogMiddleware } = require('../middlewares/log');

const router = express.Router();

// 登录接口 - 不需要认证
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
  ],
  userController.login
);

// 以下接口需要认证
router.use(authenticateToken);

// 获取当前登录用户信息
router.get('/me', userController.getCurrentUser);

// 修改当前用户个人信息
router.put(
  '/me/info',
  [
    body('real_name').notEmpty().withMessage('真实姓名不能为空')
  ],
  createLogMiddleware('update_profile', 'user'),
  userController.updateCurrentUserInfo
);

// 修改当前用户密码
router.put(
  '/me/password',
  [
    body('old_password').notEmpty().withMessage('原密码不能为空'),
    body('new_password').notEmpty().isLength({ min: 6 }).withMessage('新密码长度至少6位')
  ],
  createLogMiddleware('change_password', 'user'),
  userController.updateCurrentUserPassword
);

// 以下接口需要管理员权限
router.use(requireAdmin);

// 获取用户列表
router.get('/', userController.getUsers);

// 根据ID获取用户详情
router.get('/:id', userController.getUserById);

// 创建用户
router.post(
  '/',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().isLength({ min: 6 }).withMessage('密码长度至少6位'),
    body('real_name').notEmpty().withMessage('真实姓名不能为空'),
    body('role').isIn(['admin', 'user']).withMessage('角色类型无效')
  ],
  createLogMiddleware('create_user', 'user', (req, res) => {
    try {
      const data = JSON.parse(res);
      return data.data ? data.data.id : null;
    } catch { return null; }
  }, (req, res) => req.body.username),
  userController.createUser
);

// 更新用户
router.put(
  '/:id',
  [
    body('real_name').notEmpty().withMessage('真实姓名不能为空'),
    body('role').isIn(['admin', 'user']).withMessage('角色类型无效'),
    body('status').isIn(['active', 'inactive']).withMessage('状态无效')
  ],
  createLogMiddleware('update_user', 'user'),
  userController.updateUser
);

// 删除用户
router.delete(
  '/:id',
  createLogMiddleware('delete_user', 'user'),
  userController.deleteUser
);

module.exports = router;