const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/rules', (req, res) => {
  const rules = db.prepare('SELECT * FROM yicoin_rules WHERE is_active = 1').all();
  res.json({ success: true, data: rules });
});

router.get('/:volunteer_id', (req, res) => {
  const yicoin = db.prepare('SELECT * FROM yicoins WHERE volunteer_id = ?').get(req.params.volunteer_id);
  if (!yicoin) {
    return res.status(404).json({ success: false, message: '益币账户不存在' });
  }
  
  const transactions = db.prepare(`
    SELECT * FROM yicoin_transactions 
    WHERE volunteer_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(req.params.volunteer_id);
  
  res.json({
    success: true,
    data: { ...yicoin, recent_transactions: transactions }
  });
});

router.post('/:volunteer_id/exchange', (req, res) => {
  const { amount, reason } = req.body;
  const volunteer_id = req.params.volunteer_id;
  
  const yicoin = db.prepare('SELECT * FROM yicoins WHERE volunteer_id = ?').get(volunteer_id);
  if (!yicoin) {
    return res.status(404).json({ success: false, message: '益币账户不存在' });
  }
  
  if (yicoin.balance < amount) {
    return res.status(400).json({ success: false, message: '益币余额不足' });
  }
  
  const todayEarned = db.prepare(`
    SELECT SUM(amount) as total FROM yicoin_transactions 
    WHERE volunteer_id = ? AND type = 'earn' AND DATE(created_at) = DATE('now')
  `).get(volunteer_id).total || 0;
  
  if (todayEarned > 500) {
    return res.status(403).json({ success: false, message: '触发防刷熔断：今日收益异常' });
  }
  
  db.prepare(`
    UPDATE yicoins SET balance = balance - ?, total_spent = total_spent + ? WHERE volunteer_id = ?
  `).run(amount, amount, volunteer_id);
  
  db.prepare(`
    INSERT INTO yicoin_transactions (volunteer_id, type, amount, reason)
    VALUES (?, 'spend', ?, ?)
  `).run(volunteer_id, amount, reason || '兑换商品');
  
  res.json({ success: true, message: '兑换成功' });
});

module.exports = router;
