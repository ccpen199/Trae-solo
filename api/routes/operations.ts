import { Router, Request, Response } from 'express';
import db from '../db';
import { authenticate, requireRole } from '../middleware/auth';
import dayjs from 'dayjs';

const router = Router();

router.get('/chargers', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { station_id, status } = req.query;
  
  let sql = `
    SELECT c.*, s.name as station_name, s.address as station_address,
      (SELECT COUNT(*) FROM guns g WHERE g.charger_id = c.id) as total_guns,
      (SELECT COUNT(*) FROM guns g WHERE g.charger_id = c.id AND g.status = 'charging') as charging_guns,
      (SELECT COUNT(*) FROM guns g WHERE g.charger_id = c.id AND g.status = 'fault') as fault_guns
    FROM chargers c
    JOIN stations s ON c.station_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (station_id) {
    sql += ' AND c.station_id = ?';
    params.push(station_id);
  }
  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY c.id DESC';
  const chargers = db.prepare(sql).all(...params);
  
  res.json({ chargers });
});

router.get('/guns', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { station_id, charger_id, status } = req.query;
  
  let sql = `
    SELECT g.*, s.name as station_name,
      c.serial_number as charger_sn, c.model as charger_model, c.power as charger_power,
      o.order_no as current_order_no
    FROM guns g
    JOIN stations s ON g.station_id = s.id
    JOIN chargers c ON g.charger_id = c.id
    LEFT JOIN charging_orders o ON g.current_order_id = o.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (station_id) {
    sql += ' AND g.station_id = ?';
    params.push(station_id);
  }
  if (charger_id) {
    sql += ' AND g.charger_id = ?';
    params.push(charger_id);
  }
  if (status) {
    sql += ' AND g.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY g.id DESC';
  const guns = db.prepare(sql).all(...params);
  
  res.json({ guns });
});

router.post('/chargers/:id/restart', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const charger = db.prepare('SELECT * FROM chargers WHERE id = ?').get(req.params.id);
  if (!charger) {
    return res.status(404).json({ error: '充电桩不存在' });
  }

  db.prepare(`
    UPDATE chargers SET status = 'offline', last_heartbeat = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(req.params.id);

  setTimeout(() => {
    db.prepare(`
      UPDATE chargers SET status = 'online', last_heartbeat = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND status = 'offline'
    `).run(req.params.id);
  }, 2000);

  res.json({ message: '重启命令已发送' });
});

router.post('/guns/:id/set-status', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { status } = req.body;
  
  if (!['idle', 'fault', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: '无效的状态' });
  }

  const gun = db.prepare('SELECT * FROM guns WHERE id = ?').get(req.params.id);
  if (!gun) {
    return res.status(404).json({ error: '充电枪不存在' });
  }

  if (gun.status === 'charging') {
    return res.status(400).json({ error: '充电中无法修改状态' });
  }

  db.prepare(`
    UPDATE guns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, req.params.id);

  if (status === 'fault') {
    db.prepare(`
      INSERT INTO alarms (station_id, charger_id, gun_id, type, level, message, status)
      VALUES (?, ?, ?, 'other', 'error', ?, 'active')
    `).run(gun.station_id, gun.charger_id, gun.id, `充电枪[${gun.gun_no}]故障`);
  }

  res.json({ message: '状态已更新' });
});

router.get('/firmware', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const firmware = db.prepare('SELECT * FROM firmware ORDER BY id DESC').all();
  res.json({ firmware });
});

router.post('/firmware', authenticate, requireRole('admin'), (req: Request, res: Response) => {
  const { version, model, file_size, release_notes } = req.body;
  
  const result = db.prepare(`
    INSERT INTO firmware (version, model, file_size, release_notes)
    VALUES (?, ?, ?, ?)
  `).run(version, model, file_size || 0, release_notes || '');

  const fw = db.prepare('SELECT * FROM firmware WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ firmware: fw });
});

router.post('/chargers/:id/upgrade', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { firmware_id } = req.body;
  
  const charger = db.prepare('SELECT * FROM chargers WHERE id = ?').get(req.params.id);
  const firmware = db.prepare('SELECT * FROM firmware WHERE id = ?').get(firmware_id);
  
  if (!charger) return res.status(404).json({ error: '充电桩不存在' });
  if (!firmware) return res.status(404).json({ error: '固件不存在' });

  db.prepare(`
    UPDATE chargers SET firmware_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(firmware.version, req.params.id);

  res.json({ message: '升级命令已下发', new_version: firmware.version });
});

router.get('/alarms', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { station_id, status, level } = req.query;
  
  let sql = `
    SELECT a.*, s.name as station_name,
      c.serial_number as charger_sn,
      g.gun_no
    FROM alarms a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN chargers c ON a.charger_id = c.id
    LEFT JOIN guns g ON a.gun_id = g.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (station_id) {
    sql += ' AND a.station_id = ?';
    params.push(station_id);
  }
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  if (level) {
    sql += ' AND a.level = ?';
    params.push(level);
  }

  sql += ' ORDER BY a.id DESC LIMIT 100';
  const alarms = db.prepare(sql).all(...params);
  
  res.json({ alarms });
});

router.post('/alarms/:id/acknowledge', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  db.prepare(`
    UPDATE alarms SET status = 'acknowledged', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  
  res.json({ message: '告警已确认' });
});

router.post('/alarms/:id/resolve', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  db.prepare(`
    UPDATE alarms SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ message: '告警已解决' });
});

router.get('/work-orders', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { station_id, status, type } = req.query;
  
  let sql = `
    SELECT w.*, s.name as station_name, s.address as station_address,
      c.serial_number as charger_sn, g.gun_no
    FROM work_orders w
    JOIN stations s ON w.station_id = s.id
    LEFT JOIN chargers c ON w.charger_id = c.id
    LEFT JOIN guns g ON w.gun_id = g.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (station_id) {
    sql += ' AND w.station_id = ?';
    params.push(station_id);
  }
  if (status) {
    sql += ' AND w.status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND w.type = ?';
    params.push(type);
  }

  sql += ' ORDER BY w.id DESC LIMIT 100';
  const workOrders = db.prepare(sql).all(...params);
  
  res.json({ work_orders: workOrders });
});

router.post('/work-orders', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { station_id, charger_id, gun_id, type, priority, title, description, assignee } = req.body;
  
  if (!station_id || !type || !title) {
    return res.status(400).json({ error: '站点、类型和标题不能为空' });
  }

  const orderNo = `WO${dayjs().format('YYYYMMDDHHmmss')}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  
  const result = db.prepare(`
    INSERT INTO work_orders (
      order_no, station_id, charger_id, gun_id, type, priority,
      title, description, reporter, assignee, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    orderNo, station_id, charger_id, gun_id, type, priority || 'medium',
    title, description || '', req.user!.nickname, assignee || null
  );

  const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ work_order: workOrder });
});

router.put('/work-orders/:id', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { status, assignee, description } = req.body;
  
  const updates: string[] = [];
  const params: any[] = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
    if (status === 'completed') {
      updates.push('completed_at = CURRENT_TIMESTAMP');
    }
  }
  if (assignee) {
    updates.push('assignee = ?');
    params.push(assignee);
  }
  if (description) {
    updates.push('description = ?');
    params.push(description);
  }
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  db.prepare(`UPDATE work_orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  
  const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
  res.json({ work_order: workOrder });
});

router.get('/inspections', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { station_id } = req.query;
  
  let sql = `
    SELECT i.*, s.name as station_name, s.address as station_address
    FROM inspection_records i
    JOIN stations s ON i.station_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (station_id) {
    sql += ' AND i.station_id = ?';
    params.push(station_id);
  }

  sql += ' ORDER BY i.id DESC LIMIT 100';
  const records = db.prepare(sql).all(...params);
  
  res.json({ inspections: records });
});

router.post('/inspections', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { station_id, inspection_date, items, result, remarks } = req.body;
  
  if (!station_id || !inspection_date || !result) {
    return res.status(400).json({ error: '站点、日期和结果不能为空' });
  }

  const result2 = db.prepare(`
    INSERT INTO inspection_records (station_id, inspector, inspection_date, items, result, remarks)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(station_id, req.user!.nickname, inspection_date, items || '', result, remarks || '');

  const record = db.prepare('SELECT * FROM inspection_records WHERE id = ?').get(result2.lastInsertRowid);
  res.status(201).json({ inspection: record });
});

export default router;
