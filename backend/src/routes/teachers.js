const express = require('express');
const TeacherController = require('../controllers/TeacherController');

const router = express.Router();

router.get('/check-name', TeacherController.checkDuplicateName);
router.post('/', TeacherController.createTeacher);
router.get('/', TeacherController.searchTeachers);
router.get('/:id', TeacherController.getTeacherById);
router.put('/:id', TeacherController.updateTeacher);

router.post('/accounts', TeacherController.createTeacherAccount);
router.get('/accounts/list', TeacherController.getAccountList);
router.get('/accounts/teacher/:teacher_id', TeacherController.getAccountByTeacherId);
router.put('/accounts/teacher/:teacher_id', TeacherController.updateAccount);
router.post('/accounts/teacher/:teacher_id/reset-password', TeacherController.resetPassword);
router.post('/accounts/teacher/:teacher_id/toggle-status', TeacherController.toggleAccountStatus);

module.exports = router;
