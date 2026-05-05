const express = require('express');
const router = express.Router();
const roomService = require('../services/roomService');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      dormitory_id: req.query.dormitory_id ? parseInt(req.query.dormitory_id) : undefined,
      status: req.query.status,
      floor: req.query.floor ? parseInt(req.query.floor) : undefined,
      keyword: req.query.keyword,
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

router.get('/available', async (req, res, next) => {
  try {
    const filters = {
      gender_type: req.query.gender_type,
      dormitory_id: req.query.dormitory_id ? parseInt(req.query.dormitory_id) : undefined,
    };
    const result = await roomService.getAvailableRooms(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/beds', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      room_id: req.query.room_id ? parseInt(req.query.room_id) : undefined,
      dormitory_id: req.query.dormitory_id ? parseInt(req.query.dormitory_id) : undefined,
      keyword: req.query.keyword,
    };
    const result = await roomService.getBeds(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/beds/:id', async (req, res, next) => {
  try {
    const result = await roomService.getBedById(parseInt(req.params.id));
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
    const result = await roomService.getRoomById(parseInt(req.params.id));
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/beds', async (req, res, next) => {
  try {
    const result = await roomService.getRoomBeds(parseInt(req.params.id));
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'dormitory_admin'), requirePermission('room:manage'), async (req, res, next) => {
  try {
    const result = await roomService.createRoom(req.body);
    res.json({
      success: true,
      data: result,
      message: '房间创建成功',
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRole('admin', 'dormitory_admin'), requirePermission('room:manage'), async (req, res, next) => {
  try {
    const result = await roomService.updateRoom(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      data: result,
      message: '房间更新成功',
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin'), requirePermission('room:manage'), async (req, res, next) => {
  try {
    const result = await roomService.deleteRoom(parseInt(req.params.id));
    res.json({
      success: true,
      data: result,
      message: '房间删除成功',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;