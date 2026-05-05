const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { isTeachingAdmin, isAuthenticated } = require('../middlewares/auth.middleware');

// 获取班级列表（所有已认证用户）
router.get('/', isAuthenticated, classController.getClasses);

// 获取班级详情
router.get('/:id', isAuthenticated, classController.getClassById);

// 创建班级（教学管理员及以上）
router.post('/', isTeachingAdmin, classController.createClass);

// 更新班级（教学管理员及以上）
router.put('/:id', isTeachingAdmin, classController.updateClass);

// 删除班级（教学管理员及以上）
router.delete('/:id', isTeachingAdmin, classController.deleteClass);

module.exports = router;
