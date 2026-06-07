const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/my', authenticateToken, (req, res) => {
  const db = getDb();
  const subscriptions = db.prepare(`
    SELECT s.*, p.name as product_name, p.category
    FROM subscriptions s
    JOIN products p ON s.product_id = p.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `).all(req.user.id);
  
  res.json({ subscriptions });
});

router.post('/', authenticateToken, (req, res) => {
  const { product_id, delivery_address, delivery_phone, start_date, end_date } = req.body;
  const db = getDb();
  
  try {
    const result = db.prepare(`
      INSERT INTO subscriptions (user_id, product_id, delivery_address, delivery_phone, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, product_id, delivery_address, delivery_phone, start_date, end_date || null);
    
    res.json({ id: result.lastInsertRowid, message: '订阅成功' });
  } catch (err) {
    res.status(500).json({ error: '订阅失败' });
  }
});

router.post('/:id/change-address', authenticateToken, (req, res) => {
  const { new_address } = req.body;
  const db = getDb();
  
  const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  
  if (!subscription) {
    return res.status(404).json({ error: '订阅不存在' });
  }
  
  try {
    db.prepare(`
      INSERT INTO address_changes (subscription_id, old_address, new_address, status)
      VALUES (?, ?, ?, 'pending')
    `).run(req.params.id, subscription.delivery_address, new_address);
    
    res.json({ message: '地址变更申请已提交，等待审批' });
  } catch (err) {
    res.status(500).json({ error: '申请失败' });
  }
});

router.put('/:id/renew', authenticateToken, (req, res) => {
  const { months } = req.body;
  const db = getDb();
  
  const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  
  if (!subscription) {
    return res.status(404).json({ error: '订阅不存在' });
  }
  
  const currentEndDate = subscription.end_date ? new Date(subscription.end_date) : new Date();
  const newEndDate = new Date(currentEndDate);
  newEndDate.setMonth(newEndDate.getMonth() + (months || 12));
  
  db.prepare(`
    UPDATE subscriptions SET end_date = ?, auto_renew = 1 WHERE id = ?
  `).run(newEndDate.toISOString().split('T')[0], req.params.id);
  
  res.json({ message: '续订成功' });
});

router.get('/address-changes', authenticateToken, (req, res) => {
  const db = getDb();
  const changes = db.prepare(`
    SELECT ac.*, p.name as product_name
    FROM address_changes ac
    JOIN subscriptions s ON ac.subscription_id = s.id
    JOIN products p ON s.product_id = p.id
    WHERE s.user_id = ?
    ORDER BY ac.created_at DESC
  `).all(req.user.id);
  
  res.json({ changes });
});

function validateAddress(address) {
  const requiredKeywords = ['省', '市', '区', '街道', '号'];
  const score = requiredKeywords.filter(keyword => address.includes(keyword)).length;
  return {
    valid: score >= 3,
    score,
    suggestions: score < 3 ? ['请包含完整的省市区信息', '请填写具体的街道门牌号'] : []
  };
}

router.post('/validate-address', (req, res) => {
  const { address } = req.body;
  const result = validateAddress(address);
  res.json(result);
});

module.exports = router;
