import { Router } from 'express';
import { mockFirmwares, mockOTATasks } from '../data/mockData';

const router = Router();

router.get('/firmwares', (req, res) => {
  const { model, status } = req.query;
  let firmwares = [...mockFirmwares];

  if (model) {
    firmwares = firmwares.filter((f) => f.model === model);
  }
  if (status) {
    firmwares = firmwares.filter((f) => f.status === status);
  }

  res.json({ code: 0, data: firmwares });
});

router.post('/firmwares', (req, res) => {
  const newFirmware = {
    ...req.body,
    id: `fw_${Date.now()}`,
  };
  mockFirmwares.push(newFirmware);
  res.json({ code: 0, data: newFirmware });
});

router.put('/firmwares/:id', (req, res) => {
  const firmware = mockFirmwares.find((f) => f.id === req.params.id);
  if (!firmware) {
    return res.status(404).json({ code: 1, message: '固件不存在' });
  }
  Object.assign(firmware, req.body);
  res.json({ code: 0, data: firmware });
});

router.get('/tasks', (req, res) => {
  const { status, strategy } = req.query;
  let tasks = [...mockOTATasks];

  if (status) {
    tasks = tasks.filter((t) => t.status === status);
  }
  if (strategy) {
    tasks = tasks.filter((t) => t.strategy === strategy);
  }

  res.json({ code: 0, data: tasks });
});

router.post('/tasks', (req, res) => {
  const { firmwareId, strategy, regions, models } = req.body;
  const firmware = mockFirmwares.find((f) => f.id === firmwareId);

  const newTask = {
    id: `ota_${Date.now()}`,
    firmwareId,
    version: firmware?.version || '',
    status: 'pending' as const,
    totalDevices: 0,
    successDevices: 0,
    failedDevices: 0,
    startTime: new Date().toISOString(),
    strategy,
    regions: regions || [],
    models: models || [],
  };
  mockOTATasks.unshift(newTask);
  res.json({ code: 0, data: newTask });
});

router.put('/tasks/:id', (req, res) => {
  const task = mockOTATasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ code: 1, message: '任务不存在' });
  }
  Object.assign(task, req.body);
  res.json({ code: 0, data: task });
});

router.post('/tasks/:id/start', (req, res) => {
  const task = mockOTATasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ code: 1, message: '任务不存在' });
  }
  task.status = 'running';
  task.startTime = new Date().toISOString();
  res.json({ code: 0, message: '任务已启动' });
});

router.post('/tasks/:id/stop', (req, res) => {
  const task = mockOTATasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ code: 1, message: '任务不存在' });
  }
  task.status = 'completed';
  task.endTime = new Date().toISOString();
  res.json({ code: 0, message: '任务已停止' });
});

router.get('/models', (req, res) => {
  const models = [...new Set(mockFirmwares.map((f) => f.model))];
  res.json({ code: 0, data: models });
});

router.get('/regions', (req, res) => {
  res.json({
    code: 0,
    data: ['华北', '华东', '华南', '华中', '西南', '西北', '东北'],
  });
});

export default router;
