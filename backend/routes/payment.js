const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { page = 1, pageSize = 10, status, pay_type, biz_type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const conditions = ['user_id = ?'];
    const params = [req.user.id];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (pay_type) {
      conditions.push('pay_type = ?');
      params.push(pay_type);
    }
    if (biz_type) {
      conditions.push('biz_type = ?');
      params.push(biz_type);
    }

    const where = 'WHERE ' + conditions.join(' AND ');
    const total = db.prepare(`SELECT COUNT(*) as cnt FROM payments ${where}`).get(...params).cnt;
    const list = db.prepare(`SELECT * FROM payments ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, parseInt(pageSize), offset);

    res.json({ success: true, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { service_id, pay_type, amount, pay_channel, biz_type, remark } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: '金额必须大于0' });
    }
    const id = uuidv4();
    const orderNo = `ORD${Date.now()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    db.prepare(`INSERT INTO payments (id, user_id, service_id, order_no, pay_type, amount, status, pay_channel, biz_type, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, req.user.id, service_id || null, orderNo, pay_type || 'fee', amount, 'pending', pay_channel || null, biz_type || null, remark || null);
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/pay', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: '支付记录不存在' });
    }
    if (payment.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该订单无法支付' });
    }
    db.prepare('UPDATE payments SET status = ?, pay_time = ? WHERE id = ?')
      .run('completed', new Date().toISOString(), req.params.id);
    const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const totalCount = db.prepare('SELECT COUNT(*) as cnt FROM payments WHERE user_id = ?').get(userId).cnt;
    const completedCount = db.prepare("SELECT COUNT(*) as cnt FROM payments WHERE user_id = ? AND status = 'completed'").get(userId).cnt;
    const totalAmount = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE user_id = ? AND status = 'completed'").get(userId).total;
    const pendingCount = db.prepare("SELECT COUNT(*) as cnt FROM payments WHERE user_id = ? AND status = 'pending'").get(userId).cnt;
    const byType = db.prepare('SELECT pay_type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE user_id = ? GROUP BY pay_type').all(userId);
    const byMonth = db.prepare("SELECT strftime('%Y-%m', pay_time) as month, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE user_id = ? AND status = 'completed' AND pay_time IS NOT NULL GROUP BY month ORDER BY month DESC LIMIT 6").all(userId);

    res.json({
      success: true,
      data: {
        totalCount,
        completedCount,
        totalAmount,
        pendingCount,
        byType,
        byMonth
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
