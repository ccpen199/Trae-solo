import { Router } from 'express';
import { mockDeviceHealths, mockDevices } from '../data/mockData';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    code: 0,
    status: 'ok',
    service: 'iot-security-iot-platform-server',
    timestamp: new Date().toISOString(),
  });
});

router.get('/overview', (req, res) => {
  const totalDevices = mockDevices.length;
  const onlineDevices = mockDevices.filter((d) => d.status === 'online').length;
  const offlineDevices = mockDevices.filter((d) => d.status === 'offline').length;
  const avgHealthScore = mockDeviceHealths.reduce((sum, h) => sum + h.overallScore, 0) / mockDeviceHealths.length;
  const storageWarnings = mockDeviceHealths.filter((h) => h.storageWarning).length;
  const outdatedFirmware = mockDeviceHealths.filter((h) => h.firmwareOutdated).length;

  res.json({
    code: 0,
    data: {
      totalDevices,
      onlineDevices,
      offlineDevices,
      onlineRate: ((onlineDevices / totalDevices) * 100).toFixed(1),
      avgHealthScore: avgHealthScore.toFixed(1),
      storageWarnings,
      outdatedFirmware,
      alertToday: 156,
      alertTrend: [120, 135, 142, 128, 156, 145, 160],
      onlineTrend: [95, 96, 94, 97, 96, 98, 96],
    },
  });
});

router.get('/devices', (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  let healths = [...mockDeviceHealths];

  if (status) {
    if (status === 'warning') {
      healths = healths.filter((h) => h.storageWarning || h.firmwareOutdated || h.overallScore < 80);
    } else if (status === 'good') {
      healths = healths.filter((h) => h.overallScore >= 90);
    }
  }

  const pageNum = parseInt(page as string);
  const size = parseInt(pageSize as string);
  const total = healths.length;
  const data = healths.slice((pageNum - 1) * size, pageNum * size);

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

router.get('/devices/:id', (req, res) => {
  const health = mockDeviceHealths.find((h) => h.deviceId === req.params.id);
  if (!health) {
    return res.status(404).json({ code: 1, message: '设备不存在' });
  }

  const device = mockDevices.find((d) => d.id === req.params.id);
  const dailyStats = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dailyStats.push({
      date: date.toISOString().split('T')[0],
      onlineHours: Math.floor(Math.random() * 3) + 21,
      offlineCount: Math.floor(Math.random() * 3),
      recordingHours: Math.floor(Math.random() * 3) + 20,
    });
  }

  res.json({
    code: 0,
    data: {
      ...health,
      device,
      dailyStats,
    },
  });
});

router.get('/offline-logs/:deviceId', (req, res) => {
  const logs = [];
  const now = Date.now();

  for (let i = 0; i < 10; i++) {
    const startTime = new Date(now - i * 24 * 3600 * 1000 - Math.random() * 3600 * 1000);
    const duration = Math.floor(Math.random() * 300) + 60;
    logs.push({
      id: `offline_${i}`,
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + duration * 1000).toISOString(),
      duration,
      reason: i % 3 === 0 ? '网络波动' : '设备重启',
    });
  }

  res.json({ code: 0, data: logs });
});

router.get('/recording-integrity/:deviceId', (req, res) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const hours = [];
    for (let h = 0; h < 24; h++) {
      hours.push({
        hour: h,
        hasRecording: Math.random() > 0.05,
      });
    }
    days.push({
      date: date.toISOString().split('T')[0],
      hours,
      integrity: hours.filter((h) => h.hasRecording).length / 24,
    });
  }

  res.json({ code: 0, data: days });
});

export default router;
