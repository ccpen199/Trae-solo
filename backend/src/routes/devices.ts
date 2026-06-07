import { Router, Response } from 'express';
import db from '../database';
import {
  createDevice,
  deleteDevice,
  formatDevice,
  getDeviceByCode,
  getDeviceById,
  getDeviceHeatmap,
  getDeviceListResult,
  getDeviceStats,
  getDeviceStatus,
  updateDevice,
  updateDeviceStatus
} from '../services/deviceService';
import { authMiddleware } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();

router.get('/stats', authMiddleware, (req, res: Response) => {
  success(res, getDeviceStats());
});

router.get('/heatmap', authMiddleware, (req, res: Response) => {
  success(res, getDeviceHeatmap());
});

router.get('/code', authMiddleware, (req, res: Response) => {
  const code = String(req.query.code || '');
  if (!code) {
    error(res, '设备编号不能为空');
    return;
  }
  const device = getDeviceByCode(code);
  if (!device) {
    error(res, '设备不存在', 404);
    return;
  }
  success(res, device);
});

router.get('/', authMiddleware, (req, res: Response) => {
  const result = getDeviceListResult({
    type: req.query.type as string | undefined,
    status: req.query.status as string | undefined,
    keyword: req.query.keyword as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined
  });
  success(res, result);
});

router.post('/', authMiddleware, (req, res: Response) => {
  try {
    const payload = {
      ...req.body,
      device_no: req.body.device_no || req.body.code,
      qr_code: req.body.qr_code || req.body.qrCode || req.body.code,
      firmware_version: req.body.firmware_version || req.body.firmwareVersion
    };
    if (!payload.device_no || !payload.qr_code || !payload.type) {
      error(res, '设备编号、二维码和类型不能为空');
      return;
    }
    const device = createDevice(payload);
    success(res, device, '创建设备成功');
  } catch (e: any) {
    error(res, e.message || '创建设备失败');
  }
});

router.put('/:id', authMiddleware, (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const updated = updateDevice(id, {
    ...req.body,
    device_no: req.body.device_no || req.body.code,
    firmware_version: req.body.firmware_version || req.body.firmwareVersion
  });
  if (!updated) {
    error(res, '设备不存在', 404);
    return;
  }
  success(res, updated, '更新成功');
});

router.delete('/:id', authMiddleware, (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const deleted = deleteDevice(id);
  if (!deleted) {
    error(res, '设备不存在', 404);
    return;
  }
  success(res, { success: true }, '删除成功');
});

router.post('/:id/start', authMiddleware, (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const device = getDeviceById(id);
  if (!device) {
    error(res, '设备不存在', 404);
    return;
  }
  if (device.status !== 'idle') {
    error(res, '设备当前不可启动');
    return;
  }
  const program = req.body.program || req.body.programName || '标准洗';
  const duration = Number(req.body.duration || 30);
  updateDeviceStatus(id, 'running');
  db.prepare(`
    INSERT INTO device_reports (device_id, status, remain_time)
    VALUES (?, 'running', ?)
  `).run(id, duration);
  db.prepare(`
    INSERT INTO device_commands (device_id, command, params)
    VALUES (?, 'start', ?)
  `).run(id, JSON.stringify({ program, duration }));
  success(res, getDeviceById(id), '启动成功');
});

router.post('/:id/pause', authMiddleware, (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (!updateDeviceStatus(id, 'paused')) {
    error(res, '设备不存在', 404);
    return;
  }
  db.prepare(`
    INSERT INTO device_commands (device_id, command, params)
    VALUES (?, 'pause', '{}')
  `).run(id);
  success(res, getDeviceById(id), '暂停成功');
});

router.post('/:id/continue', authMiddleware, (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (!updateDeviceStatus(id, 'running')) {
    error(res, '设备不存在', 404);
    return;
  }
  db.prepare(`
    INSERT INTO device_commands (device_id, command, params)
    VALUES (?, 'continue', '{}')
  `).run(id);
  success(res, getDeviceById(id), '继续成功');
});

router.get('/:id', authMiddleware, (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const device = getDeviceById(id);
  if (!device) {
    error(res, '设备不存在', 404);
    return;
  }
  success(res, device);
});

router.get('/:id/status', authMiddleware, (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const status = getDeviceStatus(id);
  if (!status) {
    error(res, '设备不存在', 404);
    return;
  }
  success(res, { ...status, device: formatDevice(status.device) });
});

export default router;
