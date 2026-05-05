const express = require('express');
const router = express.Router();
const roomChangeService = require('../services/roomChangeService');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      student_id: req.query.student_id ? parseInt(req.query.student_id) : undefined,
      keyword: req.query.keyword,
    };
    const result = await roomChangeService.getRoomChangeRecords(filters);
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
    const result = await roomChangeService.getRoomChangeRecordById(parseInt(req.params.id));
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'dormitory_admin', 'student'), async (req, res, next) => {
  try {
    const result = await roomChangeService.createRoomChangeRequest(req.body);
    res.json({
      success: true,
      data: result,
      message: '调房申请提交成功',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', requireRole('admin', 'dormitory_admin'), requirePermission('roomchange:manage'), async (req, res, next) => {
  try {
    const result = await roomChangeService.approveRoomChange(
      parseInt(req.params.id), 
      req.user.id, 
      true
    );
    res.json({
      success: true,
      data: result,
      message: '调房申请已批准',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reject', requireRole('admin', 'dormitory_admin'), requirePermission('roomchange:manage'), async (req, res, next) => {
  try {
    const result = await roomChangeService.approveRoomChange(
      parseInt(req.params.id), 
      req.user.id, 
      false
    );
    res.json({
      success: true,
      data: result,
      message: '调房申请已拒绝',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;