const express = require('express');
const db = require('../db');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.post('/start', authenticate, requireRoles(['cashier', 'manager']), (req, res) => {
  const { station_id, shift_name, opening_cash } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  
  const activeShift = db.prepare(`
    SELECT * FROM shifts WHERE station_id = ? AND cashier_id = ? AND status = 'open'
  `).get(station_id || user.station_id, req.user.id);
  
  if (activeShift) {
    return res.status(400).json({ error: '您已有未交班的班次' });
  }
  
  const result = db.prepare(`
    INSERT INTO shifts (station_id, cashier_id, shift_name, start_time, opening_cash, status)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, 'open')
  `).run(station_id || user.station_id, req.user.id, shift_name || '默认班次', opening_cash || 0);
  
  res.json({ message: '班次已开启', shift_id: result.lastInsertRowid });
});

router.post('/end', authenticate, requireRoles(['cashier', 'manager']), (req, res) => {
  const { shift_id, closing_cash, remark } = req.body;
  if (!shift_id) return res.status(400).json({ error: '请选择要交接的班次' });
  
  const shift = db.prepare(`
    SELECT s.*, u.name as cashier_name, st.name as station_name
    FROM shifts s
    JOIN users u ON s.cashier_id = u.id
    JOIN stations st ON s.station_id = st.id
    WHERE s.id = ? AND s.status = 'open'
  `).get(shift_id);
  
  if (!shift) return res.status(404).json({ error: '班次不存在或已关闭' });
  if (shift.cashier_id !== req.user.id && req.user.role !== 'manager') {
    return res.status(403).json({ error: '无权限关闭此班次' });
  }
  
  const shiftTransactions = db.prepare(`
    SELECT 
      COUNT(*) as transaction_count,
      SUM(final_amount) as total_amount,
      SUM(CASE WHEN payment_method = 'cash' THEN final_amount ELSE 0 END) as cash_amount,
      SUM(CASE WHEN payment_method = 'balance' THEN final_amount ELSE 0 END) as balance_amount,
      SUM(CASE WHEN payment_method IN ('wechat', 'alipay') THEN final_amount ELSE 0 END) as online_amount
    FROM transactions WHERE shift_id = ?
  `).get(shift_id);
  
  const expectedCash = (shift.opening_cash || 0) + (shiftTransactions.cash_amount || 0);
  const cashDifference = closing_cash - expectedCash;
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE shifts 
      SET end_time = CURRENT_TIMESTAMP, closing_cash = ?, expected_cash = ?, 
          cash_difference = ?, status = 'closed', remark = ?
      WHERE id = ?
    `).run(closing_cash, expectedCash, cashDifference, remark || '', shift_id);
  });
  tx();
  
  res.json({
    message: '班次交接完成',
    shift_id,
    transaction_count: shiftTransactions.transaction_count,
    total_amount: shiftTransactions.total_amount,
    cash_amount: shiftTransactions.cash_amount,
    balance_amount: shiftTransactions.balance_amount,
    online_amount: shiftTransactions.online_amount,
    expected_cash: expectedCash,
    actual_cash: closing_cash,
    difference: cashDifference
  });
});

router.get('/my-shift', authenticate, requireRoles(['cashier', 'manager']), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const shift = db.prepare(`
    SELECT s.*, st.name as station_name
    FROM shifts s
    JOIN stations st ON s.station_id = st.id
    WHERE s.cashier_id = ? AND s.status = 'open'
    ORDER BY s.start_time DESC LIMIT 1
  `).get(req.user.id);
  
  if (shift) {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as transaction_count,
        SUM(final_amount) as total_amount,
        SUM(CASE WHEN payment_method = 'cash' THEN final_amount ELSE 0 END) as cash_amount,
        SUM(CASE WHEN payment_method = 'balance' THEN final_amount ELSE 0 END) as balance_amount,
        SUM(CASE WHEN payment_method IN ('wechat', 'alipay') THEN final_amount ELSE 0 END) as online_amount
      FROM transactions WHERE shift_id = ?
    `).get(shift.id);
    shift.stats = stats;
  }
  
  res.json(shift || null);
});

module.exports = router;
