const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireAdmin, userController.getAllUsers);

router.get('/logs', requireAdmin, userController.getOperationLogs);

router.get('/:id', requireAdmin, userController.getUserById);

router.post(
  '/',
  requireAdmin,
  [
    body('username').notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 2, max: 50 }).withMessage('用户名长度应在2-50个字符之间'),
    body('password').notEmpty().withMessage('密码不能为空')
      .isLength({ min: 6 }).withMessage('密码长度至少6位'),
    body('realName').notEmpty().withMessage('真实姓名不能为空'),
    body('role').optional().isIn(['admin', 'user']).withMessage('角色类型无效')
  ],
  userController.createUser
);

router.put(
  '/:id',
  requireAdmin,
  [
    body('realName').optional().notEmpty().withMessage('真实姓名不能为空'),
    body('role').optional().isIn(['admin', 'user']).withMessage('角色类型无效'),
    body('isActive').optional().isBoolean().withMessage('isActive必须是布尔值'),
    body('password').optional()
      .isLength({ min: 6 }).withMessage('密码长度至少6位')
  ],
  userController.updateUser
);

router.delete('/:id', requireAdmin, userController.deleteUser);

module.exports = router;
