import { Router } from 'express';
import { getDb } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const type = req.query.type || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    if (type) {
      where += ' AND e.type = ?';
      params.push(type);
    }
    if (status) {
      where += ' AND e.status = ?';
      params.push(status);
    }
    if (startDate) {
      where += ' AND e.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND e.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const total = db.prepare(`SELECT COUNT(*) AS count FROM exception_events e ${where}`).get(...params).count;
    const list = db.prepare(`
      SELECT e.*, a.account_no, t.gantry_name, t.vehicle_plate
      FROM exception_events e
      LEFT JOIN etc_accounts a ON e.account_id = a.id
      LEFT JOIN toll_records t ON e.toll_record_id = t.id
      ${where}
      ORDER BY e.id DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    res.json({ list, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const event = db.prepare(`
      SELECT e.*, a.account_no, a.balance, t.gantry_name, t.fee, t.vehicle_plate, t.entry_time, t.exit_time
      FROM exception_events e
      LEFT JOIN etc_accounts a ON e.account_id = a.id
      LEFT JOIN toll_records t ON e.toll_record_id = t.id
      WHERE e.id = ?
    `).get(req.params.id);
    if (!event) {
      return res.status(404).json({ error: '异常事件不存在' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const event = db.prepare('SELECT * FROM exception_events WHERE id = ?').get(req.params.id);
    if (!event) {
      return res.status(404).json({ error: '异常事件不存在' });
    }

    const { status, description } = req.body;
    const resolvedAt = status === 'resolved' ? new Date().toISOString() : event.resolved_at;

    db.prepare(`
      UPDATE exception_events SET status = ?, description = ?, resolved_at = ?
      WHERE id = ?
    `).run(
      status !== undefined ? status : event.status,
      description !== undefined ? description : event.description,
      resolvedAt,
      req.params.id
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'update_exception', 'exception_event', parseInt(req.params.id), JSON.stringify(req.body), req.ip);

    res.json({ message: '异常事件更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { type, toll_record_id, account_id, description } = req.body;

    if (!type) {
      return res.status(400).json({ error: '异常类型不能为空' });
    }

    const result = db.prepare(`
      INSERT INTO exception_events (type, toll_record_id, account_id, description)
      VALUES (?, ?, ?, ?)
    `).run(type, toll_record_id || null, account_id || null, description || null);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'create_exception', 'exception_event', result.lastInsertRowid, JSON.stringify({ type, toll_record_id, account_id }), req.ip);

    res.status(201).json({ id: result.lastInsertRowid, message: '异常事件创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
