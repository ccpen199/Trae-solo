const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { isTeachingAdmin, isAuthenticated } = require('../middlewares/auth.middleware');

// 获取系别列表（所有已认证用户）
router.get('/', isAuthenticated, departmentController.getDepartments);

// 获取系别详情
router.get('/:id', isAuthenticated, departmentController.getDepartmentById);

// 创建系别（教学管理员及以上）
router.post('/', isTeachingAdmin, departmentController.createDepartment);

// 更新系别（教学管理员及以上）
router.put('/:id', isTeachingAdmin, departmentController.updateDepartment);

// 删除系别（教学管理员及以上）
router.delete('/:id', isTeachingAdmin, departmentController.deleteDepartment);

module.exports = router;
