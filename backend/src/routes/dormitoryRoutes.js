const express = require('express');
const router = express.Router();
const dormitoryService = require('../services/dormitoryService');
const roomService = require('../services/roomService');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      gender_type: req.query.gender_type,
      keyword: req.query.keyword,
    };
    const result = await dormitoryService.getDormitories(filters);
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
    const roomStats = await dormitoryService.getRoomStats();
    const bedStats = await dormitoryService.getBedStats();
    res.json({
      success: true,
      data: {
        rooms: roomStats,
        beds: bedStats,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await dormitoryService.getDormitoryById(parseInt(req.params.id));
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'dormitory_admin'), requirePermission('dormitory:manage'), async (req, res, next) => {
  try {
    const result = await dormitoryService.createDormitory(req.body);
    res.json({
      success: true,
      data: result,
      message: '宿舍楼创建成功',
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRole('admin', 'dormitory_admin'), requirePermission('dormitory:manage'), async (req, res, next) => {
  try {
    const result = await dormitoryService.updateDormitory(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      data: result,
      message: '宿舍楼更新成功',
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin'), requirePermission('dormitory:manage'), async (req, res, next) => {
  try {
    const result = await dormitoryService.deleteDormitory(parseInt(req.params.id));
    res.json({
      success: true,
      data: result,
      message: '宿舍楼删除成功',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:dormitoryId/rooms', async (req, res, next) => {
  try {
    const filters = {
      dormitory_id: parseInt(req.params.dormitoryId),
      status: req.query.status,
      floor: req.query.floor ? parseInt(req.query.floor) : undefined,
    };
    const result = await roomService.getRooms(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;