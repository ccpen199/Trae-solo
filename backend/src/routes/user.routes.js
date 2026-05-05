const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isSystemAdmin, isTeachingAdmin, isAuthenticated } = require('../middlewares/auth.middleware');

// 获取角色列表（所有已认证用户）
router.get('/roles', isAuthenticated, userController.getRoles);

// 获取用户列表（系统管理员和教学管理员）
router.get('/', isTeachingAdmin, userController.getUsers);

// 获取用户详情
router.get('/:id', isTeachingAdmin, userController.getUserById);

// 创建用户（系统管理员）
router.post('/', isSystemAdmin, userController.createUser);

// 更新用户（系统管理员和教学管理员）
router.put('/:id', isTeachingAdmin, userController.updateUser);

// 重置用户密码（系统管理员）
router.post('/:id/reset-password', isSystemAdmin, userController.resetPassword);

// 删除用户（系统管理员）
router.delete('/:id', isSystemAdmin, userController.deleteUser);

module.exports = router;
