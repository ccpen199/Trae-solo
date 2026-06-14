const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/my', authenticate, (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = ['s.worker_id = ?'];
  let params = [req.user.id];
  
  if (status) {
    where.push('s.status = ?');
    params.push(status);
  }
  
  const whereClause = where.join(' AND ');
  
  const settlements = db.prepare(`
    SELECT s.*, o.id as order_id, t.title, t.task_type, t.category
    FROM settlements s
    JOIN orders o ON s.order_id = o.id
    JOIN tasks t ON o.task_id = t.id
    WHERE ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM settlements s WHERE ${whereClause}
  `).get(...params).count;
  
  const stats = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.worker_amount ELSE 0 END), 0) as total_earned,
      COALESCE(SUM(CASE WHEN s.status = 'pending' THEN s.worker_amount ELSE 0 END), 0) as pending_amount,
      COALESCE(SUM(CASE WHEN s.status = 'processing' THEN s.worker_amount ELSE 0 END), 0) as processing_amount,
      COUNT(*) as total_count
    FROM settlements s WHERE s.worker_id = ?
  `).get(req.user.id);
  
  res.json({
    data: settlements,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    stats
  });
});

router.post('/process-t1', authenticate, requireRole('admin'), (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const pendingSettlements = db.prepare(`
    SELECT s.*, o.status as order_status
    FROM settlements s
    JOIN orders o ON s.order_id = o.id
    WHERE s.status = 'pending' 
      AND s.settle_date <= ?
      AND o.status = 'completed'
  `).all(today);
  
  let processedCount = 0;
  
  const updateStmt = db.prepare(`
    UPDATE settlements SET status = 'processing', transaction_id = ? WHERE id = ?
  `);
  
  const completeStmt = db.prepare(`
    UPDATE settlements SET status = 'completed', transaction_id = ? WHERE id = ?
  `);
  
  pendingSettlements.forEach(s => {
    const txnId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    completeStmt.run(txnId, s.id);
    processedCount++;
    
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      s.worker_id, 
      'settlement', 
      '结算已完成', 
      `您的订单#${s.order_id}结算已完成，金额¥${s.worker_amount.toFixed(2)}已到账`, 
      s.id
    );
  });
  
  res.json({
    message: `已处理 ${processedCount} 笔T+1结算`,
    processedCount
  });
});

router.post('/:id/withdraw', authenticate, (req, res) => {
  const { payment_method, payment_account } = req.body;
  
  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
  
  if (!settlement) {
    return res.status(404).json({ error: '结算记录不存在' });
  }
  
  if (settlement.worker_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此结算' });
  }
  
  if (settlement.status !== 'completed') {
    return res.status(400).json({ error: '结算未完成，无法提现' });
  }
  
  if (!['wechat', 'alipay', 'bank'].includes(payment_method)) {
    return res.status(400).json({ error: '无效的提现方式' });
  }
  
  if (!payment_account) {
    return res.status(400).json({ error: '请填写收款账号' });
  }
  
  db.prepare(`
    UPDATE settlements SET 
      payment_method = ?, 
      payment_account = ?,
      status = 'processing'
    WHERE id = ?
  `).run(payment_method, payment_account, req.params.id);
  
  setTimeout(() => {
    db.prepare(`
      UPDATE settlements SET status = 'completed' WHERE id = ?
    `).run(req.params.id);
  }, 2000);
  
  res.json({ message: '提现申请已提交，预计24小时内到账' });
});

router.get('/stats/summary', authenticate, requireRole('admin'), (req, res) => {
  const stats = db.prepare(`
    SELECT
      COALESCE(SUM(amount), 0) as total_transaction,
      COALESCE(SUM(platform_fee), 0) as total_platform_fee,
      COALESCE(SUM(worker_amount), 0) as total_worker_payout,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as completed_amount,
      COUNT(*) as total_settlements
    FROM settlements
  `).get();
  
  const today = new Date().toISOString().split('T')[0];
  const todayStats = db.prepare(`
    SELECT
      COALESCE(SUM(amount), 0) as today_transaction,
      COUNT(*) as today_count
    FROM settlements WHERE DATE(created_at) = ?
  `).get(today);
  
  res.json({
    ...stats,
    today_transaction: todayStats.today_transaction,
    today_count: todayStats.today_count
  });
});

module.exports = router;
