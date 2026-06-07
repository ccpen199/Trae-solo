import express from 'express';
import db from '../db/index.js';
import { authenticate, requireRole } from '../middleware/oauth.js';
import { addWatermark } from '../utils/encryption.js';
import { getDispatchRules, updateDispatchRules } from '../services/dispatchEngine.js';
import { getCommissionRules } from '../services/commissionEngine.js';

const router = express.Router();

router.get('/heatmap', authenticate, (req, res) => {
  const { area_code, date, hour } = req.query;
  const today = new Date().toISOString().split('T')[0];

  let sql = `SELECT latitude, longitude, rider_count, order_count, intensity FROM heatmap_data WHERE record_date = ?`;
  const params = [date || today];

  if (area_code) {
    sql += ` AND area_code = ?`;
    params.push(area_code);
  }
  if (hour) {
    sql += ` AND hour_of_day = ?`;
    params.push(hour);
  }

  const data = db.prepare(sql).all(...params);
  const watermarked = addWatermark({ data }, req.user.id, req.requestId);

  res.json(watermarked);
});

router.get('/demand-prediction', authenticate, requireRole('admin'), (req, res) => {
  const { area_code, date } = req.query;
  const today = new Date().toISOString().split('T')[0];

  let sql = `SELECT * FROM area_demand_predictions WHERE prediction_date = ?`;
  const params = [date || today];

  if (area_code) {
    sql += ` AND area_code = ?`;
    params.push(area_code);
  }

  sql += ` ORDER BY hour_of_day ASC`;

  let predictions = db.prepare(sql).all(...params);

  if (predictions.length === 0) {
    for (let h = 0; h < 24; h++) {
      const baseOrder = (h >= 11 && h <= 13) || (h >= 17 && h <= 19) ? 50 : 20;
      predictions.push({
        area_code: area_code || 'default',
        prediction_date: date || today,
        hour_of_day: h,
        predicted_orders: Math.round(baseOrder + Math.random() * 30),
        supply_demand_ratio: Math.round((0.8 + Math.random() * 0.8) * 100) / 100
      });
    }
  }

  const watermarked = addWatermark({ predictions }, req.user.id, req.requestId);
  res.json(watermarked);
});

router.get('/incentive-pools', authenticate, (req, res) => {
  const now = Math.floor(Date.now() / 1000);
  const pools = db.prepare(`SELECT * FROM incentive_pools WHERE is_active = 1 AND end_time > ? ORDER BY start_time ASC`).all(now);
  res.json(pools);
});

router.post('/incentive-pools', authenticate, requireRole('admin'), (req, res) => {
  const { name, type, area_code, start_time, end_time, total_budget, min_orders, bonus_amount,
          start_hour, end_hour, bonus_per_order, zone } = req.body;

  const now = Math.floor(Date.now() / 1000);
  const today = new Date();
  const final_start_time = start_time || (start_hour ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), start_hour, 0, 0).getTime() / 1000 : now);
  const final_end_time = end_time || (end_hour ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), end_hour, 0, 0).getTime() / 1000 : now + 3600);
  const final_bonus = bonus_amount || bonus_per_order || 0;
  const final_area = area_code || zone || '';
  const final_type = type || 'peak_hour';

  const id = db.prepare(`INSERT INTO incentive_pools (name, type, area_code, start_time, end_time, total_budget, remaining_budget, min_orders, bonus_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    name, final_type, final_area, final_start_time, final_end_time, total_budget, total_budget, min_orders || 0, final_bonus
  ).lastInsertRowid;

  res.json({ success: true, poolId: id, data: { id, poolId: id } });
});

router.get('/forecast', authenticate, requireRole('admin'), (req, res) => {
  req.url = '/demand-prediction';
  router.handle(req, res, () => {});
});

router.get('/incentives', authenticate, (req, res) => {
  req.url = '/incentive-pools';
  router.handle(req, res, () => {});
});

router.post('/incentives', authenticate, requireRole('admin'), (req, res) => {
  req.url = '/incentive-pools';
  router.handle(req, res, () => {});
});

router.get('/appeals', authenticate, (req, res) => {
  const { status, limit = 20, offset = 0 } = req.query;

  let sql = `SELECT at.*, o.order_no, u.real_name as rider_name FROM appeal_tickets at LEFT JOIN orders o ON at.order_id = o.id LEFT JOIN users u ON at.user_id = u.id`;
  const params = [];

  if (req.user.role !== 'admin') {
    sql += ` WHERE at.user_id = ?`;
    params.push(req.user.id);
  }

  if (status) {
    sql += req.user.role !== 'admin' ? ` AND` : ` WHERE`;
    sql += ` at.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY at.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const tickets = db.prepare(sql).all(...params);
  res.json(tickets);
});

router.post('/appeals', authenticate, (req, res) => {
  const { order_id, type, title, description, photo_urls, evidence_url } = req.body;

  const typeTitles = {
    timeout: '超时申诉',
    reject: '拒收申诉',
    wrong_delivery: '错送申诉',
    other: '其他申诉'
  };

  const final_title = title || typeTitles[type] || '申诉工单';
  const final_photos = photo_urls || (evidence_url ? [evidence_url] : null);

  const id = db.prepare(`INSERT INTO appeal_tickets (order_id, user_id, type, title, description, photo_urls) VALUES (?, ?, ?, ?, ?, ?)`).run(
    order_id || null, req.user.id, type || 'other', final_title, description || '', final_photos ? JSON.stringify(final_photos) : null
  ).lastInsertRowid;

  res.json({ success: true, ticketId: id, appealId: id, data: { id, appealId: id, ticketId: id } });
});

router.post('/appeals/:id/handle', authenticate, requireRole('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const { status, handling_result, resolution, resolution_note, compensation_amount } = req.body;
  const now = Math.floor(Date.now() / 1000);

  let result = handling_result || '';
  if (resolution) result += resolution + ' ';
  if (resolution_note) result += '备注: ' + resolution_note + ' ';
  if (compensation_amount) result += '补偿: ¥' + compensation_amount;

  db.prepare(`UPDATE appeal_tickets SET status = ?, handler_id = ?, handled_at = ?, handling_result = ? WHERE id = ?`).run(
    status || 'resolved', req.user.id, now, result.trim() || '', id
  );

  if (compensation_amount && status === 'resolved') {
    const appeal = db.prepare(`SELECT user_id FROM appeal_tickets WHERE id = ?`).get(id);
    if (appeal) {
      db.prepare(`UPDATE wallets SET balance = balance + ?, total_income = total_income + ?, updated_at = ? WHERE user_id = ?`).run(
        compensation_amount, compensation_amount, now, appeal.user_id
      );
      db.prepare(`INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description) VALUES (?, 'compensation', ?, (SELECT balance FROM wallets WHERE user_id = ?), '申诉补偿')`).run(
        appeal.user_id, compensation_amount, appeal.user_id
      );
    }
  }

  res.json({ success: true, status: status || 'resolved' });
});

router.post('/appeals/:id/process', authenticate, requireRole('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const { status, handling_result, resolution, resolution_note, compensation_amount } = req.body;
  const now = Math.floor(Date.now() / 1000);

  let result = handling_result || '';
  if (resolution) result += resolution + ' ';
  if (resolution_note) result += '备注: ' + resolution_note + ' ';
  if (compensation_amount) result += '补偿: ¥' + compensation_amount;

  db.prepare(`UPDATE appeal_tickets SET status = ?, handler_id = ?, handled_at = ?, handling_result = ? WHERE id = ?`).run(
    status || 'resolved', req.user.id, now, result.trim() || '', id
  );

  if (compensation_amount && (status === 'resolved' || !status)) {
    const appeal = db.prepare(`SELECT user_id FROM appeal_tickets WHERE id = ?`).get(id);
    if (appeal) {
      db.prepare(`UPDATE wallets SET balance = balance + ?, total_income = total_income + ?, updated_at = ? WHERE user_id = ?`).run(
        compensation_amount, compensation_amount, now, appeal.user_id
      );
      db.prepare(`INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description) VALUES (?, 'compensation', ?, (SELECT balance FROM wallets WHERE user_id = ?), '申诉补偿')`).run(
        appeal.user_id, compensation_amount, appeal.user_id
      );
    }
  }

  res.json({ success: true, status: status || 'resolved' });
});

router.get('/dispatch-rules', authenticate, requireRole('admin'), (req, res) => {
  res.json(getDispatchRules());
});

router.put('/dispatch-rules/:id', authenticate, requireRole('admin'), (req, res) => {
  const result = updateDispatchRules(parseInt(req.params.id), req.body);
  res.json(result);
});

router.get('/riders', authenticate, requireRole('admin'), (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  let sql = `SELECT u.id, u.username, u.real_name, u.phone, u.status, u.created_at,
                    rv.verification_status, v.binding_status,
                    rs.total_orders, rs.completed_orders, rs.fulfillment_rate, rs.level, rs.rating, rs.total_income
             FROM users u
             LEFT JOIN rider_verifications rv ON u.id = rv.user_id
             LEFT JOIN rider_vehicles v ON u.id = v.user_id
             LEFT JOIN rider_stats rs ON u.id = rs.user_id
             WHERE u.role = 'rider'`;

  if (status) {
    sql += ` AND u.status = ?`;
    const riders = db.prepare(sql).all(status);
    return res.json(riders.map(r => ({ ...r, phone: r.phone ? r.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null })));
  }

  sql += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
  const riders = db.prepare(sql).all(limit, offset);
  res.json(riders.map(r => ({ ...r, phone: r.phone ? r.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null })));
});

router.put('/riders/:id/verify', authenticate, requireRole('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const { verification_type, status, rejection_reason } = req.body;
  const now = Math.floor(Date.now() / 1000);

  if (verification_type === 'identity') {
    db.prepare(`UPDATE rider_verifications SET verification_status = ?, rejection_reason = ?, verified_at = ?, updated_at = ? WHERE user_id = ?`).run(
      status, rejection_reason || '', status === 'verified' ? now : null, now, id
    );
    if (status === 'verified') {
      db.prepare(`UPDATE users SET status = 'verified', updated_at = ? WHERE id = ?`).run(now, id);
    }
  } else if (verification_type === 'vehicle') {
    db.prepare(`UPDATE rider_vehicles SET binding_status = ?, verified_at = ?, updated_at = ? WHERE user_id = ?`).run(
      status, status === 'bound' ? now : null, now, id
    );
  }

  res.json({ success: true });
});

router.get('/orders', authenticate, requireRole('admin'), (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  let sql = `SELECT o.*, u.real_name as rider_name FROM orders o LEFT JOIN users u ON o.rider_id = u.id`;
  const params = [];

  if (status) {
    sql += ` WHERE o.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const orders = db.prepare(sql).all(...params);
  res.json(orders.map(o => ({ ...o, customer_phone: o.customer_phone ? o.customer_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null })));
});

router.get('/dashboard/stats', authenticate, requireRole('admin'), (req, res) => {
  const now = Math.floor(Date.now() / 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = Math.floor(todayStart.getTime() / 1000);

  const totalRiders = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'rider'`).get().count;
  const activeRiders = db.prepare(`SELECT COUNT(DISTINCT user_id) as count FROM gps_traces WHERE timestamp > ?`).get(now - 3600).count;
  const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders`).get().count;
  const todayOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE created_at >= ?`).get(todayTs).count;
  const pendingOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`).get().count;
  const totalAmount = db.prepare(`SELECT COALESCE(SUM(total_fee), 0) as sum FROM orders`).get().sum;
  const totalSettled = db.prepare(`SELECT COALESCE(SUM(amount), 0) as sum FROM wallet_transactions WHERE type = 'income'`).get().sum;
  const pendingAppeals = db.prepare(`SELECT COUNT(*) as count FROM appeal_tickets WHERE status = 'pending'`).get().count;

  res.json({
    totalRiders,
    activeRiders,
    totalOrders,
    todayOrders,
    pendingOrders,
    totalAmount,
    totalSettled,
    pendingAppeals
  });
});

router.get('/commission-rules', authenticate, requireRole('admin'), (req, res) => {
  res.json(getCommissionRules());
});

export default router;
