const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  const { listing_id, amount } = req.body;

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listing_id);
  if (!listing) {
    return res.status(404).json({ error: '信息不存在' });
  }
  if (listing.user_id === req.user.id) {
    return res.status(400).json({ error: '不能与自己交易' });
  }

  const depositAmount = amount * 0.2;

  const result = db.prepare(`
    INSERT INTO transactions (listing_id, buyer_id, seller_id, amount, deposit_amount, status)
    VALUES (?, ?, ?, ?, ?, 'deposit_pending')
  `).run(listing_id, req.user.id, listing.user_id, amount, depositAmount);

  db.prepare('INSERT INTO operation_logs (operator_id, action, target_type, target_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, 'create_transaction', 'transaction', result.lastInsertRowid
  );

  res.json({ id: result.lastInsertRowid, message: '交易创建成功' });
});

router.post('/:id/freeze-deposit', authenticateToken, (req, res) => {
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  
  if (!tx) {
    return res.status(404).json({ error: '交易不存在' });
  }
  if (tx.buyer_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作' });
  }
  if (tx.status !== 'deposit_pending') {
    return res.status(400).json({ error: '当前状态不支持此操作' });
  }

  db.prepare(`
    UPDATE transactions SET status = 'deposit_frozen', deposit_frozen_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  res.json({ message: '定金已冻结' });
});

router.post('/:id/confirm-service', authenticateToken, (req, res) => {
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  
  if (!tx) {
    return res.status(404).json({ error: '交易不存在' });
  }
  if (tx.buyer_id !== req.user.id && tx.seller_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作' });
  }
  if (tx.status !== 'deposit_frozen') {
    return res.status(400).json({ error: '当前状态不支持此操作' });
  }

  if (tx.buyer_id === req.user.id) {
    db.prepare('UPDATE transactions SET buyer_confirmed = 1 WHERE id = ?').run(req.params.id);
  } else {
    db.prepare('UPDATE transactions SET seller_confirmed = 1 WHERE id = ?').run(req.params.id);
  }

  const updatedTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  
  if (updatedTx.buyer_confirmed && updatedTx.seller_confirmed) {
    db.prepare(`
      UPDATE transactions SET status = 'completed', service_confirmed_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
  }

  res.json({ message: '确认成功' });
});

router.get('/my', authenticateToken, (req, res) => {
  const { type = 'all' } = req.query;
  
  let sql = `
    SELECT t.*, l.title as listing_title, l.price as listing_price,
           ub.nickname as buyer_name, us.nickname as seller_name
    FROM transactions t
    LEFT JOIN listings l ON t.listing_id = l.id
    LEFT JOIN users ub ON t.buyer_id = ub.id
    LEFT JOIN users us ON t.seller_id = us.id
    WHERE 
  `;
  const params = [];

  if (type === 'buyer') {
    sql += 't.buyer_id = ?';
    params.push(req.user.id);
  } else if (type === 'seller') {
    sql += 't.seller_id = ?';
    params.push(req.user.id);
  } else {
    sql += '(t.buyer_id = ? OR t.seller_id = ?)';
    params.push(req.user.id, req.user.id);
  }

  sql += ' ORDER BY t.created_at DESC';

  const transactions = db.prepare(sql).all(...params);
  res.json(transactions);
});

module.exports = router;
