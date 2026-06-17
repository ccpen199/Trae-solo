import { Router } from 'express';
import { mockDevices, mockDeviceGroups } from '../data/mockData';

const router = Router();

router.get('/', (req, res) => {
  const { groupId, status, type } = req.query;
  let devices = [...mockDevices];

  if (groupId) {
    devices = devices.filter((d) => d.groupId === groupId);
  }
  if (status) {
    devices = devices.filter((d) => d.status === status);
  }
  if (type) {
    devices = devices.filter((d) => d.type === type);
  }

  res.json({ code: 0, data: devices });
});

router.get('/groups', (req, res) => {
  res.json({ code: 0, data: mockDeviceGroups });
});

router.get('/:id', (req, res) => {
  const device = mockDevices.find((d) => d.id === req.params.id);
  if (!device) {
    return res.status(404).json({ code: 1, message: '设备不存在' });
  }
  res.json({ code: 0, data: device });
});

router.put('/:id', (req, res) => {
  const device = mockDevices.find((d) => d.id === req.params.id);
  if (!device) {
    return res.status(404).json({ code: 1, message: '设备不存在' });
  }
  Object.assign(device, req.body);
  res.json({ code: 0, data: device });
});

router.put('/:id/privacy', (req, res) => {
  const device = mockDevices.find((d) => d.id === req.params.id);
  if (!device) {
    return res.status(404).json({ code: 1, message: '设备不存在' });
  }
  device.privacy = { ...device.privacy, ...req.body };
  res.json({ code: 0, data: device.privacy });
});

router.post('/:id/reboot', (req, res) => {
  res.json({ code: 0, message: '重启指令已下发' });
});

router.post('/bind', (req, res) => {
  const { deviceId, wifiSsid, wifiPassword } = req.body;
  res.json({
    code: 0,
    message: '设备绑定成功',
    data: {
      deviceId,
      bindTime: new Date().toISOString(),
      wifiSsid,
    },
  });
});

router.get('/:id/recordings', (req, res) => {
  const { date, type } = req.query;
  const recordings = [];
  const baseDate = date ? new Date(date as string) : new Date();

  for (let i = 0; i < 24; i += 2) {
    const startTime = new Date(baseDate);
    startTime.setHours(i, 0, 0, 0);
    const endTime = new Date(baseDate);
    endTime.setHours(i + 1, 30, 0, 0);

    recordings.push({
      id: `rec_${i}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: 5400,
      type: type || 'continuous',
      size: Math.floor(Math.random() * 500) + 100,
      locked: i === 6 || i === 14,
    });
  }

  res.json({ code: 0, data: recordings });
});

export default router;
