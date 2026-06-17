import { Router } from 'express';
import { mockAuditLogs } from '../data/mockData';

const router = Router();

router.get('/', (req, res) => {
  const { userId, action, deviceId, startTime, endTime, page = 1, pageSize = 20 } = req.query;
  let logs = [...mockAuditLogs];

  if (userId) {
    logs = logs.filter((l) => l.userId === userId);
  }
  if (action) {
    logs = logs.filter((l) => l.action.includes(action as string));
  }
  if (deviceId) {
    logs = logs.filter((l) => l.deviceId === deviceId);
  }
  if (startTime) {
    logs = logs.filter((l) => l.timestamp >= startTime);
  }
  if (endTime) {
    logs = logs.filter((l) => l.timestamp <= endTime);
  }

  const pageNum = parseInt(page as string);
  const size = parseInt(pageSize as string);
  const total = logs.length;
  const data = logs.slice((pageNum - 1) * size, pageNum * size);

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

router.get('/actions', (req, res) => {
  const actions = [...new Set(mockAuditLogs.map((l) => l.action))];
  res.json({ code: 0, data: actions });
});

export default router;
