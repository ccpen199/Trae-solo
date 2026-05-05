const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/grade.controller');
const { isTeacherOrAdmin, isAuthenticated, isTeachingAdmin } = require('../middlewares/auth.middleware');

// 获取我的成绩（学生专用）
router.get('/my', isAuthenticated, gradeController.getMyGrades);

// 获取成绩统计（教师和管理员）
router.get('/statistics', isTeacherOrAdmin, gradeController.getStatistics);

// 获取成绩列表
router.get('/', isTeacherOrAdmin, gradeController.getGrades);

// 获取成绩详情
router.get('/:id', isAuthenticated, gradeController.getGradeById);

// 创建成绩（教师和管理员）
router.post('/', isTeacherOrAdmin, gradeController.createGrade);

// 批量创建成绩（教师和管理员）
router.post('/batch', isTeacherOrAdmin, gradeController.batchCreate);

// 更新成绩（教师和管理员）
router.put('/:id', isTeacherOrAdmin, gradeController.updateGrade);

// 删除成绩（教学管理员及以上）
router.delete('/:id', isTeachingAdmin, gradeController.deleteGrade);

module.exports = router;
