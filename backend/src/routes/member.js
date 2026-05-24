const express = require('express');
const db = require('../db');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/vehicles', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const vehicles = db.prepare(`
    SELECT v.*, ft.name as fuel_type_name 
    FROM vehicles v 
    LEFT JOIN fuel_types ft ON v.fuel_type_id = ft.id 
    WHERE v.member_id = ?
    ORDER BY v.default_flag DESC, v.id
  `).all(req.user.id);
  res.json(vehicles);
});

router.post('/vehicles', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const { plate_number, brand, model, color, fuel_type_id, default_flag } = req.body;
  if (!plate_number) return res.status(400).json({ error: '车牌号不能为空' });
  
  const exists = db.prepare('SELECT id FROM vehicles WHERE plate_number = ?').get(plate_number);
  if (exists) return res.status(400).json({ error: '该车牌号已被绑定' });
  
  const stmt = db.prepare(`
    INSERT INTO vehicles (member_id, plate_number, brand, model, color, fuel_type_id, default_flag)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  if (default_flag) {
    db.prepare('UPDATE vehicles SET default_flag = 0 WHERE member_id = ?').run(req.user.id);
  }
  
  const result = stmt.run(req.user.id, plate_number, brand || '', model || '', color || '', fuel_type_id || null, default_flag ? 1 : 0);
  res.json({ id: result.lastInsertRowid, message: '车辆绑定成功' });
});

router.delete('/vehicles/:id', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND member_id = ?').get(req.params.id, req.user.id);
  if (!vehicle) return res.status(404).json({ error: '车辆不存在' });
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
  res.json({ message: '解绑成功' });
});

router.put('/vehicles/:id/default', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND member_id = ?').get(req.params.id, req.user.id);
  if (!vehicle) return res.status(404).json({ error: '车辆不存在' });
  
  const tx = db.transaction(() => {
    db.prepare('UPDATE vehicles SET default_flag = 0 WHERE member_id = ?').run(req.user.id);
    db.prepare('UPDATE vehicles SET default_flag = 1 WHERE id = ?').run(req.params.id);
  });
  tx();
  res.json({ message: '设置成功' });
});

router.get('/coupons', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const { status } = req.query;
  let sql = `
    SELECT mc.*, c.name, c.type, c.value, c.min_amount, c.valid_from, c.valid_to, c.fuel_type_ids, ft.name as fuel_name
    FROM member_coupons mc
    JOIN coupons c ON mc.coupon_id = c.id
    LEFT JOIN fuel_types ft ON c.fuel_type_ids = ft.id
    WHERE mc.member_id = ?
  `;
  const params = [req.user.id];
  if (status) {
    sql += ' AND mc.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY mc.acquired_at DESC';
  const coupons = db.prepare(sql).all(...params);
  res.json(coupons);
});

router.get('/transactions', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const count = db.prepare('SELECT COUNT(*) as total FROM transactions WHERE member_id = ?').get(req.user.id);
  const transactions = db.prepare(`
    SELECT t.*, s.name as station_name, n.nozzle_number, ft.name as fuel_type_name,
           v.plate_number
    FROM transactions t
    JOIN stations s ON t.station_id = s.id
    JOIN nozzles n ON t.nozzle_id = n.id
    JOIN fuel_types ft ON t.fuel_type_id = ft.id
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.member_id = ?
    ORDER BY t.end_time DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(pageSize), offset);
  
  res.json({ list: transactions, total: count.total, page, pageSize });
});

router.get('/stored-value-history', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const records = db.prepare(`
    SELECT svt.*, svp.name as package_name
    FROM stored_value_transactions svt
    LEFT JOIN stored_value_packages svp ON svt.package_id = svp.id
    WHERE svt.member_id = ?
    ORDER BY svt.created_at DESC
  `).all(req.user.id);
  res.json(records);
});

router.get('/transactions-available-for-invoice', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  db.prepare('UPDATE transactions SET invoice_status = ? WHERE invoice_status = ? AND member_id = ?').run('not_issued', 'none', req.user.id);
  const transactions = db.prepare(`
    SELECT t.*, s.name as station_name, n.nozzle_number, ft.name as fuel_type_name, v.plate_number
    FROM transactions t
    JOIN stations s ON t.station_id = s.id
    JOIN nozzles n ON t.nozzle_id = n.id
    JOIN fuel_types ft ON t.fuel_type_id = ft.id
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.member_id = ? AND t.invoice_status = 'not_issued'
    ORDER BY t.end_time DESC
  `).all(req.user.id);
  res.json(transactions);
});

router.post('/stored-value', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const { package_id, amount, payment_method } = req.body;
  
  let pkg = null;
  let actualAmount = amount;
  let bonusAmount = 0;
  let bonusPoints = 0;
  
  if (package_id) {
    pkg = db.prepare('SELECT * FROM stored_value_packages WHERE id = ? AND status = ?').get(package_id, 'active');
    if (!pkg) return res.status(400).json({ error: '储值包不存在' });
    actualAmount = pkg.amount;
    bonusAmount = pkg.bonus_amount;
    bonusPoints = pkg.bonus_points;
  } else if (!amount || amount <= 0) {
    return res.status(400).json({ error: '储值金额不能为空' });
  }
  
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.user.id);
  const balanceBefore = member.balance;
  const pointsBefore = member.points;
  const balanceAfter = balanceBefore + actualAmount + bonusAmount;
  const pointsAfter = pointsBefore + bonusPoints;
  
  const tx = db.transaction(() => {
    db.prepare('UPDATE members SET balance = ?, points = ? WHERE id = ?').run(balanceAfter, pointsAfter, req.user.id);
    
    db.prepare(`
      INSERT INTO stored_value_transactions 
      (member_id, package_id, amount, bonus_amount, bonus_points, balance_before, balance_after, 
       points_before, points_after, type, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'recharge', ?)
    `).run(req.user.id, package_id || null, actualAmount, bonusAmount, bonusPoints, balanceBefore, balanceAfter, pointsBefore, pointsAfter, payment_method || 'online');
  });
  tx();
  
  res.json({ message: '储值成功', balance: balanceAfter, points: pointsAfter });
});

router.get('/invoices', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const invoices = db.prepare(`
    SELECT i.*, t.end_time as transaction_time, t.final_amount as transaction_amount,
           s.name as station_name
    FROM invoices i
    JOIN transactions t ON i.transaction_id = t.id
    JOIN stations s ON t.station_id = s.id
    WHERE i.member_id = ?
    ORDER BY i.created_at DESC
  `).all(req.user.id);
  res.json(invoices);
});

router.post('/invoices', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const { transaction_id, invoice_type, invoice_title, tax_number } = req.body;
  
  if (!transaction_id || !invoice_type || !invoice_title) {
    return res.status(400).json({ error: '请填写完整的发票信息' });
  }
  
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ? AND member_id = ?').get(transaction_id, req.user.id);
  if (!transaction) return res.status(404).json({ error: '交易记录不存在' });
  if (transaction.invoice_status === 'issued') return res.status(400).json({ error: '该交易已开具发票' });
  
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO invoices (transaction_id, member_id, invoice_type, invoice_title, tax_number, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(transaction_id, req.user.id, invoice_type, invoice_title, tax_number || '', transaction.final_amount);
    
    db.prepare('UPDATE transactions SET invoice_status = ? WHERE id = ?').run('pending', transaction_id);
  });
  tx();
  
  res.json({ message: '发票申请已提交' });
});

router.post('/complaints', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const { transaction_id, type, description } = req.body;
  if (!type || !description) return res.status(400).json({ error: '请填写完整的申诉信息' });
  
  db.prepare(`
    INSERT INTO complaints (member_id, transaction_id, type, description)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, transaction_id || null, type, description);
  
  res.json({ message: '申诉已提交，我们将尽快处理' });
});

router.get('/complaints', authenticate, (req, res) => {
  if (req.user.role !== 'member') return res.status(403).json({ error: '权限不足' });
  const complaints = db.prepare(`
    SELECT c.*, t.end_time as transaction_time, t.final_amount
    FROM complaints c
    LEFT JOIN transactions t ON c.transaction_id = t.id
    WHERE c.member_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user.id);
  res.json(complaints);
});

module.exports = router;
