import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware.js';

const router = express.Router();

function calculatePrice(waterUsed, startTime) {
  const pricing = db.prepare('SELECT * FROM pricing_rules WHERE is_active = 1').get();
  if (!pricing) return waterUsed * 0.05;
  
  const hour = new Date(startTime).getHours();
  const isNight = hour >= pricing.night_start_hour || hour < pricing.night_end_hour;
  
  let pricePerLiter = pricing.base_price;
  
  if (pricing.type === 'tiered') {
    if (waterUsed <= pricing.tier1_limit) {
      pricePerLiter = pricing.tier1_price;
    } else if (waterUsed <= pricing.tier2_limit) {
      pricePerLiter = pricing.tier2_price;
    } else {
      pricePerLiter = pricing.tier3_price;
    }
  }
  
  if (isNight) {
    pricePerLiter *= pricing.night_discount;
  }
  
  return waterUsed * pricePerLiter;
}

router.get('/stats/monthly', authenticateToken, (req, res) => {
  const studentId = req.user.studentId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const stats = db.prepare(`
    SELECT 
      COALESCE(SUM(water_used), 0) as total_water,
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(*) as total_count
    FROM transactions 
    WHERE student_id = ? AND start_time >= ? AND status = 'completed'
  `).get(studentId, monthStart);
  
  const allTimeStats = db.prepare(`
    SELECT 
      COALESCE(SUM(water_used), 0) as total_water,
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(*) as total_count
    FROM transactions 
    WHERE student_id = ? AND status = 'completed'
  `).get(studentId);
  
  res.json({
    monthly: stats,
    allTime: allTimeStats
  });
});

router.get('/', authenticateToken, (req, res) => {
  const { student_id, device_id, start_date, end_date, page = 1, pageSize = 20 } = req.query;
  
  let query = `
    SELECT t.*, d.name as device_name, d.building, d.location as device_location
    FROM transactions t
    LEFT JOIN devices d ON t.device_id = d.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user.role === 'student') {
    query += ' AND t.student_id = ?';
    params.push(req.user.studentId);
  } else if (student_id) {
    query += ' AND t.student_id = ?';
    params.push(student_id);
  }
  
  if (device_id) {
    query += ' AND t.device_id = ?';
    params.push(device_id);
  }
  if (start_date) {
    query += ' AND t.start_time >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND t.start_time <= ?';
    params.push(end_date);
  }
  
  query += ' ORDER BY t.start_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const transactions = db.prepare(query).all(...params);
  
  let countQuery = 'SELECT COUNT(*) as count FROM transactions WHERE 1=1';
  const countParams = [];
  if (req.user.role === 'student') {
    countQuery += ' AND student_id = ?';
    countParams.push(req.user.studentId);
  } else if (student_id) {
    countQuery += ' AND student_id = ?';
    countParams.push(student_id);
  }
  if (device_id) {
    countQuery += ' AND device_id = ?';
    countParams.push(device_id);
  }
  if (start_date) {
    countQuery += ' AND start_time >= ?';
    countParams.push(start_date);
  }
  if (end_date) {
    countQuery += ' AND start_time <= ?';
    countParams.push(end_date);
  }
  
  const total = db.prepare(countQuery).get(...countParams);
  
  res.json({ transactions, total: total.count });
});

router.get('/:id', authenticateToken, (req, res) => {
  const transaction = db.prepare(`
    SELECT t.*, 
           d.name as device_name, d.building as building, d.location as device_location, d.floor as floor,
           s.name as student_name, s.alipay_user_id as alipay_user_id, s.phone as student_phone
    FROM transactions t
    LEFT JOIN devices d ON t.device_id = d.id
    LEFT JOIN students s ON t.student_id = s.student_id
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!transaction) {
    return res.status(404).json({ error: '账单不存在' });
  }
  
  if (req.user.role === 'student' && transaction.student_id !== req.user.studentId) {
    return res.status(403).json({ error: '无权限访问' });
  }
  
  const relatedAlerts = db.prepare(`
    SELECT * FROM alerts 
    WHERE device_id = ? 
      AND created_at BETWEEN ? AND ?
    ORDER BY created_at DESC
  `).all(transaction.device_id, transaction.start_time, transaction.end_time || new Date().toISOString());
  
  const pricingRules = db.prepare(`
    SELECT * FROM pricing_rules WHERE is_active = 1
  `).all();
  
  res.json({
    ...transaction,
    related_alerts: relatedAlerts,
    pricing_rules: pricingRules,
  });
});

router.post('/start', authenticateToken, (req, res) => {
  const { device_id, auth_token } = req.body;
  const studentId = req.user.studentId;
  
  const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(studentId);
  if (!student) {
    return res.status(404).json({ error: '学生不存在' });
  }
  
  if (student.balance < 5) {
    db.prepare(`
      INSERT INTO messages (student_id, type, title, content)
      VALUES (?, ?, ?, ?)
    `).run(studentId, 'balance_warning', '余额不足提醒', `您的账户余额为${student.balance.toFixed(2)}元，低于最低消费限额，请及时充值。`);
    
    return res.status(402).json({ error: '余额不足，请先充值', balance: student.balance });
  }
  
  const startTime = new Date().toISOString();
  
  const result = db.prepare(`
    INSERT INTO transactions (student_id, device_id, start_time, status)
    VALUES (?, ?, ?, 'active')
  `).run(studentId, device_id, startTime);
  
  db.prepare("UPDATE devices SET status = 'running', last_online = CURRENT_TIMESTAMP WHERE id = ?").run(device_id);
  
  res.json({
    transactionId: result.lastInsertRowid,
    studentId,
    deviceId: device_id,
    startTime,
    balance: student.balance
  });
});

router.post('/:id/end', authenticateToken, (req, res) => {
  const { water_used, avg_temp, avg_flow } = req.body;
  
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: '账单不存在' });
  }
  
  if (req.user.role === 'student' && transaction.student_id !== req.user.studentId) {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  const endTime = new Date().toISOString();
  const duration = Math.floor((new Date(endTime) - new Date(transaction.start_time)) / 1000);
  const amount = calculatePrice(water_used, transaction.start_time);
  
  const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(transaction.student_id);
  const newBalance = student.balance - amount;
  
  db.prepare(`
    UPDATE transactions 
    SET end_time = ?, duration = ?, water_used = ?, avg_temp = ?, avg_flow = ?, amount = ?, status = 'completed'
    WHERE id = ?
  `).run(endTime, duration, water_used, avg_temp, avg_flow, amount, req.params.id);
  
  db.prepare('UPDATE students SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE student_id = ?').run(newBalance, transaction.student_id);
  
  db.prepare("UPDATE devices SET status = 'online', last_online = CURRENT_TIMESTAMP WHERE id = ?").run(transaction.device_id);
  
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(transaction.device_id);
  const today = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();
  
  db.prepare(`
    INSERT OR REPLACE INTO energy_statistics (date, building, hour, total_water, total_amount, usage_count)
    VALUES (?, ?, ?, 
      COALESCE((SELECT total_water FROM energy_statistics WHERE date = ? AND building = ? AND hour = ?), 0) + ?,
      COALESCE((SELECT total_amount FROM energy_statistics WHERE date = ? AND building = ? AND hour = ?), 0) + ?,
      COALESCE((SELECT usage_count FROM energy_statistics WHERE date = ? AND building = ? AND hour = ?), 0) + 1
    )
  `).run(today, device.building, hour, today, device.building, hour, water_used, today, device.building, hour, amount, today, device.building, hour);
  
  if (newBalance < 10 && student.balance >= 10) {
    db.prepare(`
      INSERT INTO messages (student_id, type, title, content)
      VALUES (?, ?, ?, ?)
    `).run(transaction.student_id, 'balance_warning', '余额不足提醒', `您的账户余额为${newBalance.toFixed(2)}元，建议及时充值以避免影响使用。`);
  }
  
  res.json({
    transactionId: transaction.id,
    amount,
    duration,
    waterUsed: water_used,
    newBalance
  });
});

router.post('/recharge', authenticateToken, (req, res) => {
  const { amount, payment_method = 'alipay' } = req.body;
  const studentId = req.user.studentId;
  
  if (amount <= 0) {
    return res.status(400).json({ error: '充值金额必须大于0' });
  }
  
  const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(studentId);
  if (!student) {
    return res.status(404).json({ error: '学生不存在' });
  }
  
  const newBalance = student.balance + amount;
  const tradeNo = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  db.prepare('UPDATE students SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE student_id = ?').run(newBalance, studentId);
  
  db.prepare(`
    INSERT INTO recharge_records (student_id, amount, payment_method, trade_no, status)
    VALUES (?, ?, ?, ?, 'success')
  `).run(studentId, amount, payment_method, tradeNo);
  
  res.json({
    success: true,
    tradeNo,
    amount,
    newBalance
  });
});

router.get('/recharge/history', authenticateToken, (req, res) => {
  const records = db.prepare(`
    SELECT * FROM recharge_records 
    WHERE student_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(req.user.studentId);
  
  res.json(records);
});

export default router;
