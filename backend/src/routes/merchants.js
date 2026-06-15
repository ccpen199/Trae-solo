const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  const merchants = db.prepare('SELECT * FROM merchants ORDER BY id').all();
  res.json({ success: true, data: merchants });
});

router.get('/:id', (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id);
  if (!merchant) {
    return res.status(404).json({ success: false, message: '商户不存在' });
  }
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
      SUM(CASE WHEN delivery_status = 'delivered' THEN total_fee ELSE 0 END) as total_spent,
      AVG(CASE WHEN delivery_status = 'delivered' AND picked_up_at IS NOT NULL AND delivered_at IS NOT NULL 
        THEN (julianday(delivered_at) - julianday(picked_up_at)) * 24 * 60 ELSE NULL END) as avg_delivery_time
    FROM orders WHERE merchant_id = ?
  `).get(req.params.id);
  
  res.json({ success: true, data: { ...merchant, stats } });
});

router.post('/', (req, res) => {
  const { name, contact_name, contact_phone, address, latitude, longitude, balance } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: '商户名称不能为空' });
  }
  
  const result = db.prepare(`
    INSERT INTO merchants (name, contact_name, contact_phone, address, latitude, longitude, balance)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, contact_name || '', contact_phone || '', address || '', latitude || null, longitude || null, balance || 0);
  
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: merchant });
});

router.put('/:id/balance', (req, res) => {
  const { amount, type } = req.body;
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id);
  
  if (!merchant) {
    return res.status(404).json({ success: false, message: '商户不存在' });
  }
  
  const newBalance = type === 'deduct' 
    ? merchant.balance - amount 
    : merchant.balance + amount;
  
  if (newBalance < 0) {
    return res.status(400).json({ success: false, message: '余额不足' });
  }
  
  db.prepare('UPDATE merchants SET balance = ? WHERE id = ?').run(newBalance, req.params.id);
  
  res.json({ success: true, data: { balance: newBalance } });
});

module.exports = router;
