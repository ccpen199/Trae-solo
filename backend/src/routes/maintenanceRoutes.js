const express = require('express');
const router = express.Router();
const maintenanceService = require('../services/maintenanceService');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      student_id: req.query.student_id ? parseInt(req.query.student_id) : undefined,
      dormitory_id: req.query.dormitory_id ? parseInt(req.query.dormitory_id) : undefined,
      keyword: req.query.keyword,
    };
    const result = await maintenanceService.getMaintenanceTickets(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const result = await maintenanceService.getStats();
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
    const result = await maintenanceService.getMaintenanceTicketById(parseInt(req.params.id));
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const result = await maintenanceService.createMaintenanceTicket(req.body);
    res.json({
      success: true,
      data: result,
      message: '维修申请提交成功',
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const result = await maintenanceService.updateMaintenanceTicket(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      data: result,
      message: '维修单更新成功',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/process', requireRole('admin', 'dormitory_admin'), requirePermission('maintenance:manage'), async (req, res, next) => {
  try {
    const result = await maintenanceService.processTicket(parseInt(req.params.id), req.user.id);
    res.json({
      success: true,
      data: result,
      message: '维修单已受理',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/complete', requireRole('admin', 'dormitory_admin'), requirePermission('maintenance:manage'), async (req, res, next) => {
  try {
    const result = await maintenanceService.completeTicket(parseInt(req.params.id), req.body.solution);
    res.json({
      success: true,
      data: result,
      message: '维修单已完成',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;