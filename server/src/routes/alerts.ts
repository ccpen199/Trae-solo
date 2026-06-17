import { Router } from 'express';
import { mockAlerts } from '../data/mockData';

const router = Router();

router.get('/', (req, res) => {
  const { deviceId, type, level, read, page = 1, pageSize = 20 } = req.query;
  let alerts = [...mockAlerts];

  if (deviceId) {
    alerts = alerts.filter((a) => a.deviceId === deviceId);
  }
  if (type) {
    alerts = alerts.filter((a) => a.type === type);
  }
  if (level) {
    alerts = alerts.filter((a) => a.level === level);
  }
  if (read !== undefined) {
    alerts = alerts.filter((a) => a.read === (read === 'true'));
  }

  const pageNum = parseInt(page as string);
  const size = parseInt(pageSize as string);
  const total = alerts.length;
  const data = alerts.slice((pageNum - 1) * size, pageNum * size);

  res.json({
    code: 0,
    data: {
      list: data,
      total,
      page: pageNum,
      pageSize: size,
    },
  });
});

router.get('/unread-count', (req, res) => {
  const count = mockAlerts.filter((a) => !a.read).length;
  res.json({ code: 0, data: { count } });
});

router.put('/read-all', (req, res) => {
  mockAlerts.forEach((a) => {
    a.read = true;
  });
  res.json({ code: 0, data: { count: mockAlerts.length }, message: '全部标记成功' });
});

router.put('/read', (req, res) => {
  const { ids } = req.body;
  if (ids) {
    mockAlerts.forEach((a) => {
      if (ids.includes(a.id)) {
        a.read = true;
      }
    });
  } else {
    mockAlerts.forEach((a) => {
      a.read = true;
    });
  }
  res.json({ code: 0, message: '标记成功' });
});

router.get('/:id', (req, res) => {
  const alert = mockAlerts.find((a) => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ code: 1, message: '告警不存在' });
  }
  res.json({ code: 0, data: alert });
});

router.put('/:id/read', (req, res) => {
  const alert = mockAlerts.find((a) => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ code: 1, message: '告警不存在' });
  }
  alert.read = true;
  res.json({ code: 0, data: alert, message: '标记成功' });
});

router.put('/:id/lock', (req, res) => {
  const alert = mockAlerts.find((a) => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ code: 1, message: '告警不存在' });
  }
  alert.locked = true;
  res.json({ code: 0, data: { locked: alert.locked } });
});

router.put('/:id/unlock', (req, res) => {
  const alert = mockAlerts.find((a) => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ code: 1, message: '告警不存在' });
  }
  alert.locked = false;
  res.json({ code: 0, data: { locked: alert.locked } });
});

router.delete('/:id', (req, res) => {
  const index = mockAlerts.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ code: 1, message: '告警不存在' });
  }
  mockAlerts.splice(index, 1);
  res.json({ code: 0, message: '删除成功' });
});

export default router;
