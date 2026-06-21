import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getNearbyDevices, getDeviceById } from '../services/deviceService.js';

const router = Router();

router.get('/nearby', authMiddleware(['student']), (req, res): void => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius) || 500;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ code: 400, message: '经纬度参数无效', data: null });
    return;
  }

  const devices = getNearbyDevices(lat, lng, radius);
  res.json({ code: 200, message: 'success', data: devices });
});

router.get('/:id', authMiddleware(['student', 'investor', 'admin']), (req, res): void => {
  const device = getDeviceById(req.params.id);
  if (!device) {
    res.status(404).json({ code: 404, message: '设备不存在', data: null });
    return;
  }
  res.json({ code: 200, message: 'success', data: device });
});

export default router;
