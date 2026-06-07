import { Router, Response } from 'express';
import db from '../db/database.ts';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.ts';
import { getCreditHistory } from '../services/credit.ts';

const router = Router();

function serializeKnight(row: any) {
  if (!row) return row;
  return {
    ...row,
    load_rate: row.capacity > 0 
      ? parseFloat(((row.current_load / row.capacity) * 100).toFixed(1))
      : 0,
    completion_rate: row.total_orders > 0
      ? parseFloat(((row.completed_orders / row.total_orders) * 100).toFixed(1))
      : 0,
    active_order_count: row.active_order_count || 0,
    location: {
      lat: row.lat,
      lng: row.lng,
    },
    capacity_info: {
      current: row.current_load,
      max: row.capacity,
      remaining: row.capacity - row.current_load,
    },
  };
}

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const offset = (page - 1) * pageSize;

  const type = req.query.type as string;
  const status = req.query.status as string;

  let sql = `
    SELECT k.*,
      (SELECT COUNT(*) FROM waybills w WHERE w.knight_id = k.id AND w.status IN ('accepted', 'picked_up', 'delivering')) as active_order_count
    FROM knights k
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (type) {
    conditions.push('k.type = ?');
    params.push(type);
  }
  if (status) {
    conditions.push('k.status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY k.current_load DESC, k.credit_score DESC LIMIT ? OFFSET ?';
  params.push(pageSize, offset);

  const knights = db.prepare(sql).all(...params).map(serializeKnight);

  let countSql = 'SELECT COUNT(*) as count FROM knights k';
  if (conditions.length > 0) {
    countSql += ' WHERE ' + conditions.join(' AND ');
  }
  const total = db.prepare(countSql).get(...params.slice(0, -2)) as { count: number };

  res.json({
    code: 0,
    data: {
      list: knights,
      total: total.count,
      page,
      pageSize,
    },
    message: 'Success',
  });
});

router.post('/', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  const { name, phone, type, capacity } = req.body;

  const result = db.prepare(`
    INSERT INTO knights (name, phone, type, capacity, status, lat, lng, last_active_at)
    VALUES (?, ?, ?, ?, 'offline', 0, 0, ?)
  `).run(
    name,
    phone,
    type,
    capacity || 5,
    new Date().toISOString()
  );

  const knight = db.prepare('SELECT * FROM knights WHERE id = ?').get(result.lastInsertRowid);

  res.json({
    code: 0,
    data: knight,
    message: 'Knight created successfully',
  });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const knight = db.prepare('SELECT * FROM knights WHERE id = ?').get(id);

  if (!knight) {
    return res.json({ code: -1, message: 'Knight not found' });
  }

  const currentOrders = db.prepare(`
    SELECT w.*, m.company_name as merchant_name
    FROM waybills w
    LEFT JOIN merchants m ON w.merchant_id = m.id
    WHERE w.knight_id = ? AND w.status IN ('accepted', 'picked_up', 'delivering')
    ORDER BY w.created_at DESC
  `).all(id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const todayStats = db.prepare(`
    SELECT
      COUNT(*) as total_today,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_today
    FROM waybills
    WHERE knight_id = ? AND created_at >= ?
  `).get(id, todayIso) as { total_today: number; completed_today: number };

  res.json({
    code: 0,
    data: {
      ...knight,
      current_orders: currentOrders,
      today_stats: todayStats,
    },
    message: 'Success',
  });
});

router.put('/:id/location', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { lat, lng, speed, heading } = req.body;

  const knight = db.prepare('SELECT * FROM knights WHERE id = ?').get(id);

  if (!knight) {
    return res.json({ code: -1, message: 'Knight not found' });
  }

  db.prepare(`
    UPDATE knights SET lat = ?, lng = ?, last_active_at = ? WHERE id = ?
  `).run(lat, lng, new Date().toISOString(), id);

  const updated = db.prepare('SELECT * FROM knights WHERE id = ?').get(id);

  res.json({
    code: 0,
    data: updated,
    message: 'Location updated successfully',
  });
});

router.put('/:id/status', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  const knight = db.prepare('SELECT * FROM knights WHERE id = ?').get(id);

  if (!knight) {
    return res.json({ code: -1, message: 'Knight not found' });
  }

  if (!['online', 'offline', 'busy', 'suspended'].includes(status)) {
    return res.json({ code: -1, message: 'Invalid status' });
  }

  db.prepare('UPDATE knights SET status = ?, last_active_at = ? WHERE id = ?').run(
    status,
    new Date().toISOString(),
    id
  );

  const updated = db.prepare('SELECT * FROM knights WHERE id = ?').get(id);

  res.json({
    code: 0,
    data: updated,
    message: 'Status updated successfully',
  });
});

router.get('/:id/credit-history', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 50;
  const offset = (page - 1) * pageSize;

  const history = getCreditHistory(id, pageSize, offset);

  res.json({
    code: 0,
    data: {
      list: history.logs,
      total: history.total,
      page,
      pageSize,
    },
    message: 'Success',
  });
});

export default router;
