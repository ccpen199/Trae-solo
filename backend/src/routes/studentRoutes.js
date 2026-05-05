const express = require('express');
const router = express.Router();
const checkInService = require('../services/checkInService');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      major: req.query.major,
      grade: req.query.grade ? parseInt(req.query.grade) : undefined,
      keyword: req.query.keyword,
      has_check_in: req.query.has_check_in === 'true' ? true : 
                      req.query.has_check_in === 'false' ? false : undefined,
    };
    const result = await checkInService.getStudents(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await checkInService.getStudentById(parseInt(req.params.id));
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'dormitory_admin'), requirePermission('checkin:manage'), async (req, res, next) => {
  try {
    const result = await checkInService.createStudent(req.body);
    res.json({
      success: true,
      data: result,
      message: '学生创建成功',
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRole('admin', 'dormitory_admin'), requirePermission('checkin:manage'), async (req, res, next) => {
  try {
    const result = await checkInService.updateStudent(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      data: result,
      message: '学生信息更新成功',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/check-in/records', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      student_id: req.query.student_id ? parseInt(req.query.student_id) : undefined,
      dormitory_id: req.query.dormitory_id ? parseInt(req.query.dormitory_id) : undefined,
      room_id: req.query.room_id ? parseInt(req.query.room_id) : undefined,
      keyword: req.query.keyword,
    };
    const result = await checkInService.getCheckInRecords(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/check-in/records/:id', async (req, res, next) => {
  try {
    const result = await checkInService.getCheckInRecordById(parseInt(req.params.id));
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/check-in', requireRole('admin', 'dormitory_admin'), requirePermission('checkin:manage'), async (req, res, next) => {
  try {
    const result = await checkInService.createCheckIn(req.body);
    res.json({
      success: true,
      data: result,
      message: '入住办理成功',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/check-out/:id', requireRole('admin', 'dormitory_admin'), requirePermission('checkout:manage'), async (req, res, next) => {
  try {
    const result = await checkInService.checkOut(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      ...result,
      message: '迁出办理成功',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;