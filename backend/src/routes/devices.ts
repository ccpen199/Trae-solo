import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { brand, type, status, room } = req.query;
    let sql = 'SELECT * FROM devices WHERE user_id = ?';
    const params: any[] = [req.user!.id];

    if (brand) { sql += ' AND brand = ?'; params.push(brand); }
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (room) { sql += ' AND room = ?'; params.push(room); }

    sql += ' ORDER BY created_at DESC';
    const devices = db.prepare(sql).all(...params);
    res.json({ success: true, data: devices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/discover', authMiddleware, (_req: Request, res: Response) => {
  try {
    const discovered = [
      { device_id: 'DISC-001', name: '客厅空调', brand: 'Haier', model: 'KFR-72LW', type: 'air_conditioner', protocol: 'wifi', status: 'online', room: '客厅' },
      { device_id: 'DISC-002', name: '卧室洗衣机', brand: 'Casarte', model: 'C1 HD10G6XU1', type: 'washer', protocol: 'wifi', status: 'online', room: '卧室' },
      { device_id: 'DISC-003', name: '智能窗帘', brand: 'Haier', model: 'ZNCL-01', type: 'curtain', protocol: 'zigbee', status: 'offline', room: '客厅' }
    ];
    res.json({ success: true, data: discovered });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { device_id, name, brand, model, type, protocol, status, has_wifi, ir_code, room, firmware_version } = req.body;
    if (!device_id || !name || !brand || !type || !protocol) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }

    const result = db.prepare(
      'INSERT INTO devices (device_id, name, brand, model, type, protocol, status, has_wifi, ir_code, room, user_id, firmware_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(device_id, name, brand, model || null, type, protocol, status || 'offline', has_wifi ?? 1, ir_code || null, room || null, req.user!.id, firmware_version || null);

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: device });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: '设备ID已存在' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    const { name, brand, model, type, protocol, status, has_wifi, ir_code, room, firmware_version } = req.body;
    db.prepare(
      `UPDATE devices SET name = COALESCE(?, name), brand = COALESCE(?, brand), model = COALESCE(?, model),
       type = COALESCE(?, type), protocol = COALESCE(?, protocol), status = COALESCE(?, status),
       has_wifi = COALESCE(?, has_wifi), ir_code = COALESCE(?, ir_code), room = COALESCE(?, room),
       firmware_version = COALESCE(?, firmware_version), last_online = CASE WHEN status = 'online' AND ? = 'offline' THEN NULL WHEN ? = 'online' THEN CURRENT_TIMESTAMP ELSE last_online END
       WHERE id = ?`
    ).run(name || null, brand || null, model || null, type || null, protocol || null, status || null, has_wifi ?? null, ir_code || null, room || null, firmware_version || null, status || null, status || null, id);

    const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    db.prepare('DELETE FROM devices WHERE id = ?').run(id);
    res.json({ success: true, message: '设备已删除' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/command', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { command, params: cmdParams } = req.body;
    if (!command) {
      return res.status(400).json({ success: false, message: '缺少command参数' });
    }

    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    if (device.status === 'offline') {
      return res.status(400).json({ success: false, message: '设备离线，无法发送指令' });
    }

    if (command === 'turn_on' || command === 'turn_off') {
      const newStatus = command === 'turn_on' ? 'online' : 'offline';
      db.prepare('UPDATE devices SET status = ?, last_online = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);
    }

    db.prepare('INSERT INTO device_metrics (device_id, metric_key, metric_value) VALUES (?, ?, ?)').run(
      Number(id), `command_${command}`, 1
    );

    res.json({ success: true, data: { deviceId: id, command, params: cmdParams || {}, timestamp: new Date().toISOString() } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
