import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getStudentByUserId } from '../services/studentService.js';
import { startTransaction, updateTransactionVolume, endTransaction } from '../services/transactionService.js';
import { updateDeviceQueue } from '../services/deviceService.js';

const router = Router();

router.post('/start', authMiddleware(['student']), (req, res): void => {
  const { deviceId } = req.body as { deviceId: string };
  if (!deviceId) {
    res.status(400).json({ code: 400, message: '缺少设备ID', data: null });
    return;
  }

  const student = getStudentByUserId(req.auth!.userId);
  if (!student) {
    res.status(404).json({ code: 404, message: '学生档案不存在', data: null });
    return;
  }

  updateDeviceQueue(deviceId, 1);
  const tx = startTransaction(student.id, deviceId);
  res.json({ code: 200, message: '用水已开始', data: tx });
});

router.post('/update/:id', authMiddleware(['student']), (req, res): void => {
  const { volume } = req.body as { volume: number };
  if (volume === undefined || volume < 0) {
    res.status(400).json({ code: 400, message: '无效的用水量', data: null });
    return;
  }

  const tx = updateTransactionVolume(req.params.id, volume);
  if (!tx) {
    res.status(404).json({ code: 404, message: '交易不存在', data: null });
    return;
  }
  res.json({ code: 200, message: 'success', data: tx });
});

router.post('/end/:id', authMiddleware(['student']), (req, res): void => {
  const { volume, deviceId } = req.body as { volume: number; deviceId: string };
  if (volume === undefined || volume < 0) {
    res.status(400).json({ code: 400, message: '无效的用水量', data: null });
    return;
  }

  if (deviceId) {
    updateDeviceQueue(deviceId, -1);
  }

  const tx = endTransaction(req.params.id, volume);
  if (!tx) {
    res.status(404).json({ code: 404, message: '交易不存在', data: null });
    return;
  }
  res.json({ code: 200, message: '用水已结束', data: tx });
});

export default router;
