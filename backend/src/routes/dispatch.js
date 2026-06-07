import { Router } from 'express';
import { getDb } from '../db/index.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { findBestRider } from '../services/dispatch.js';

const router = Router();

router.post('/auto', auth, (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.json({ code: 1, message: '订单ID不能为空' });
    }

    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) return res.json({ code: 1, message: '订单不存在' });
    if (order.status !== 'pending') return res.json({ code: 1, message: '订单状态不允许调度' });

    const riders = db.prepare(`
      SELECT r.*, MAX(o.created_at) as last_order_time,
        COUNT(o.id) as total_orders,
        SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed_orders
      FROM riders r
      LEFT JOIN orders o ON o.rider_id = r.id
      WHERE r.status = 'active' AND r.role != 'admin'
      GROUP BY r.id
    `).all();

    const riderLocations = db.prepare('SELECT * FROM rider_locations WHERE is_online = 1').all();

    const candidates = findBestRider(order, riders, riderLocations);

    const now = new Date().toISOString();
    if (candidates.length > 0) {
      const best = candidates[0];
      db.prepare('INSERT INTO dispatch_logs (order_id, rider_id, match_score, dispatch_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(order_id, best.rider_id, best.score, 'auto', 'dispatched', now);
    } else {
      db.prepare('INSERT INTO dispatch_logs (order_id, rider_id, match_score, dispatch_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(order_id, null, 0, 'auto', 'no_rider_available', now);
    }

    res.json({ code: 0, data: { candidates, total: candidates.length }, message: candidates.length > 0 ? '调度成功' : '暂无可用骑手' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/grid', (req, res) => {
  try {
    const db = getDb();
    const grids = db.prepare('SELECT * FROM area_grids ORDER BY id').all();
    res.json({ code: 0, data: grids, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/grid/:id', auth, adminOnly, (req, res) => {
  try {
    const { online_riders, pending_orders, demand_level, supply_level } = req.body;
    const db = getDb();
    const now = new Date().toISOString();

    const updates = [];
    const values = [];

    if (online_riders !== undefined) { updates.push('online_riders = ?'); values.push(online_riders); }
    if (pending_orders !== undefined) { updates.push('pending_orders = ?'); values.push(pending_orders); }
    if (demand_level !== undefined) { updates.push('demand_level = ?'); values.push(demand_level); }
    if (supply_level !== undefined) { updates.push('supply_level = ?'); values.push(supply_level); }

    if (updates.length === 0) {
      return res.json({ code: 1, message: '没有可更新的字段' });
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(req.params.id);

    db.prepare(`UPDATE area_grids SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ code: 0, data: null, message: '更新成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

export default router;
