const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { isTeachingAdmin, isAuthenticated } = require('../middlewares/auth.middleware');

// 获取课程列表（所有已认证用户）
router.get('/', isAuthenticated, courseController.getCourses);

// 获取课程详情
router.get('/:id', isAuthenticated, courseController.getCourseById);

// 创建课程（教学管理员及以上）
router.post('/', isTeachingAdmin, courseController.createCourse);

// 更新课程（教学管理员及以上）
router.put('/:id', isTeachingAdmin, courseController.updateCourse);

// 删除课程（教学管理员及以上）
router.delete('/:id', isTeachingAdmin, courseController.deleteCourse);

module.exports = router;
