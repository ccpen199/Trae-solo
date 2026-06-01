const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const { leader_id, period, status } = req.query;
  let sql = `
    SELECT c.*, l.name as leader_name, l.phone as leader_phone
    FROM commissions c 
    LEFT JOIN leaders l ON c.leader_id = l.id
    ORDER BY c.created_at DESC
  `;
  let params = [];
  let conditions = [];
  
  if (leader_id) {
    conditions.push('c.leader_id = ?');
    params.push(leader_id);
  }
  if (period) {
    conditions.push('c.period = ?');
    params.push(period);
  }
  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    sql = `
      SELECT c.*, l.name as leader_name, l.phone as leader_phone
      FROM commissions c 
      LEFT JOIN leaders l ON c.leader_id = l.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.created_at DESC
    `;
  }
  
  const commissions = db.prepare(sql).all(...params);
  res.json({ success: true, data: commissions });
});

router.get('/summary', (req, res) => {
  const { leader_id, period } = req.query;
  
  let sql = `
    SELECT 
      leader_id,
      period,
      SUM(sales_amount) as total_sales,
      SUM(refund_amount) as total_refund,
      SUM(penalty_amount) as total_penalty,
      SUM(commission_amount) as total_commission,
      COUNT(*) as order_count
    FROM commissions
    GROUP BY leader_id, period
  `;
  let params = [];
  let conditions = [];
  
  if (leader_id) {
    conditions.push('leader_id = ?');
    params.push(leader_id);
  }
  if (period) {
    conditions.push('period = ?');
    params.push(period);
  }
  
  if (conditions.length > 0) {
    sql = `
      SELECT 
        leader_id,
        period,
        SUM(sales_amount) as total_sales,
        SUM(refund_amount) as total_refund,
        SUM(penalty_amount) as total_penalty,
        SUM(commission_amount) as total_commission,
        COUNT(*) as order_count
      FROM commissions
      WHERE ${conditions.join(' AND ')}
      GROUP BY leader_id, period
    `;
  }
  
  const summary = db.prepare(sql).all(...params);
  res.json({ success: true, data: summary });
});

router.post('/:id/approve', (req, res) => {
  const { approved_by } = req.body;
  
  const commission = db.prepare('SELECT * FROM commissions WHERE id = ?').get(req.params.id);
  if (!commission) {
    return res.status(404).json({ success: false, message: '分佣记录不存在' });
  }
  
  db.prepare(`
    UPDATE commissions 
    SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approved_by || 'admin', req.params.id);
  
  res.json({ success: true, message: '审批通过' });
});

router.post('/:id/adjust', (req, res) => {
  const { commission_rate, penalty_amount, reason, adjusted_by } = req.body;
  
  const commission = db.prepare('SELECT * FROM commissions WHERE id = ?').get(req.params.id);
  if (!commission) {
    return res.status(404).json({ success: false, message: '分佣记录不存在' });
  }
  
  const newRate = commission_rate !== undefined ? commission_rate : commission.commission_rate;
  const newPenalty = penalty_amount !== undefined ? penalty_amount : commission.penalty_amount;
  const newCommission = (commission.sales_amount - commission.refund_amount - newPenalty) * newRate;
  
  db.prepare(`
    UPDATE commissions 
    SET commission_rate = ?, penalty_amount = ?, commission_amount = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newRate, newPenalty, newCommission, req.params.id);
  
  res.json({ success: true, message: '佣金调整成功，待重新审批' });
});

router.post('/:id/pay', (req, res) => {
  const commission = db.prepare('SELECT * FROM commissions WHERE id = ?').get(req.params.id);
  if (!commission) {
    return res.status(404).json({ success: false, message: '分佣记录不存在' });
  }
  
  if (commission.status !== 'approved') {
    return res.status(400).json({ success: false, message: '分佣未审批通过' });
  }
  
  db.prepare(`
    UPDATE commissions 
    SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ success: true, message: '打款成功' });
});

module.exports = router;
