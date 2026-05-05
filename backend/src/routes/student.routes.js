const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { isTeachingAdmin, isAuthenticated } = require('../middlewares/auth.middleware');

// 获取学生列表（所有已认证用户）
router.get('/', isAuthenticated, studentController.getStudents);

// 获取学生详情
router.get('/:id', isAuthenticated, studentController.getStudentById);

// 创建学生（教学管理员及以上）
router.post('/', isTeachingAdmin, studentController.createStudent);

// 更新学生（教学管理员及以上）
router.put('/:id', isTeachingAdmin, studentController.updateStudent);

// 删除学生（教学管理员及以上）
router.delete('/:id', isTeachingAdmin, studentController.deleteStudent);

module.exports = router;
