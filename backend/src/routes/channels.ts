import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const channels = db.prepare('SELECT * FROM channels ORDER BY level, created_at').all();
    res.json({ success: true, data: channels });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name, code, parent_id, level } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: '缺少必填字段name和code' });
    }

    const result = db.prepare(
      'INSERT INTO channels (name, code, parent_id, level) VALUES (?, ?, ?, ?)'
    ).run(name, code, parent_id || null, level || 1);

    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: channel });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: '渠道编码已存在' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(id) as any;
    if (!channel) {
      return res.status(404).json({ success: false, message: '渠道不存在' });
    }

    const { name, code, parent_id, level } = req.body;
    db.prepare(
      `UPDATE channels SET name = COALESCE(?, name), code = COALESCE(?, code),
       parent_id = COALESCE(?, parent_id), level = COALESCE(?, level) WHERE id = ?`
    ).run(name || null, code || null, parent_id ?? null, level || null, id);

    const updated = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/bind-device', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { device_id, permission_level } = req.body;
    if (!device_id) {
      return res.status(400).json({ success: false, message: '缺少device_id' });
    }

    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(id) as any;
    if (!channel) {
      return res.status(404).json({ success: false, message: '渠道不存在' });
    }

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(device_id) as any;
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    const existing = db.prepare('SELECT * FROM channel_device_bindings WHERE channel_id = ? AND device_id = ?').get(id, device_id) as any;
    if (existing) {
      return res.status(409).json({ success: false, message: '设备已绑定到该渠道' });
    }

    const result = db.prepare(
      'INSERT INTO channel_device_bindings (channel_id, device_id, bound_by, permission_level) VALUES (?, ?, ?, ?)'
    ).run(id, device_id, req.user!.id, permission_level || 'view');

    const binding = db.prepare('SELECT * FROM channel_device_bindings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: binding });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id/bind-device/:deviceId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id, deviceId } = req.params;
    const binding = db.prepare('SELECT * FROM channel_device_bindings WHERE channel_id = ? AND device_id = ?').get(id, deviceId) as any;
    if (!binding) {
      return res.status(404).json({ success: false, message: '绑定关系不存在' });
    }

    db.prepare('DELETE FROM channel_device_bindings WHERE channel_id = ? AND device_id = ?').run(id, deviceId);
    res.json({ success: true, message: '设备已解绑' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/devices', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(id) as any;
    if (!channel) {
      return res.status(404).json({ success: false, message: '渠道不存在' });
    }

    const devices = db.prepare(
      'SELECT d.*, cdb.permission_level, cdb.bound_at FROM devices d JOIN channel_device_bindings cdb ON d.id = cdb.device_id WHERE cdb.channel_id = ?'
    ).all(id);

    res.json({ success: true, data: devices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
