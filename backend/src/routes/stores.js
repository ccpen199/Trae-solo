import { Router } from 'express';
import db from '../db/init.js';

const router = Router();

router.get('/', (req, res) => {
  const stores = db.prepare('SELECT * FROM stores WHERE status = ? ORDER BY id').all('active');
  res.json({ success: true, data: stores });
});

router.post('/', (req, res) => {
  const { name, address, business_hours_start, business_hours_end } = req.body;
  const stmt = db.prepare(`
    INSERT INTO stores (name, address, business_hours_start, business_hours_end)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(name, address, business_hours_start || '08:00', business_hours_end || '22:00');
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.get('/:id/dashboard', (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const scheduleCount = db.prepare(`
    SELECT COUNT(*) as count FROM schedules WHERE store_id = ? AND schedule_date = ?
  `).get(id, targetDate);

  const leaveCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    WHERE e.store_id = ? AND lr.leave_date = ? AND lr.status = 'approved'
  `).get(id, targetDate);

  const warningBatches = db.prepare(`
    SELECT COUNT(*) as count
    FROM material_batches mb
    JOIN materials m ON mb.material_id = m.id
    WHERE mb.store_id = ? AND mb.quantity > 0
      AND julianday(mb.expiry_date) - julianday('now') <= m.warning_days
      AND julianday(mb.expiry_date) - julianday('now') >= 0
  `).get(id);

  const lossToday = db.prepare(`
    SELECT COUNT(*) as count, SUM(quantity) as total_qty
    FROM material_loss
    WHERE store_id = ? AND loss_date = ?
  `).get(id, targetDate);

  const abnormalLoss = db.prepare(`
    SELECT COUNT(*) as count
    FROM material_loss
    WHERE store_id = ? AND is_abnormal = 1 AND follow_up_status = 'pending'
  `).get(id);

  res.json({
    success: true,
    data: {
      schedule_count: scheduleCount.count,
      leave_count: leaveCount.count,
      warning_batches: warningBatches.count,
      loss_today_count: lossToday.count,
      loss_today_qty: lossToday.total_qty || 0,
      abnormal_loss_count: abnormalLoss.count
    }
  });
});

export default router;
