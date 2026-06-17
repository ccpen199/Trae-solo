import { Router } from 'express';
import { mockStoragePlans, mockDevices } from '../data/mockData';

const router = Router();

router.get('/plans', (req, res) => {
  res.json({ code: 0, data: mockStoragePlans });
});

router.get('/status/:deviceId', (req, res) => {
  const device = mockDevices.find((d) => d.id === req.params.deviceId);
  if (!device) {
    return res.status(404).json({ code: 1, message: '设备不存在' });
  }
  res.json({
    code: 0,
    data: {
      cloudStorage: {
        enabled: true,
        plan: 'cloud_7d',
        expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        total: 128,
        used: device.storage.used,
      },
      sdCard: {
        enabled: device.storage.sdCard,
        total: device.storage.sdTotal,
        used: device.storage.sdUsed,
        health: 'good',
        formatTime: '2024-01-15T08:00:00Z',
      },
      lockedCount: 5,
      lockedSize: 256,
    },
  });
});

router.post('/subscribe', (req, res) => {
  const { planType, deviceId } = req.body;
  res.json({
    code: 0,
    message: '订阅成功',
    data: {
      planType,
      deviceId,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    },
  });
});

router.post('/sd-card/format', (req, res) => {
  const { deviceId } = req.body;
  const device = mockDevices.find((d) => d.id === deviceId);
  if (device) {
    device.storage.sdUsed = 0;
  }
  res.json({ code: 0, message: '格式化指令已下发' });
});

export default router;
