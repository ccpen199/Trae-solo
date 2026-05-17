const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/balance', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT keep_coins FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, data: { balance: user.keep_coins } });
  } catch (error) {
    console.error('获取余额错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/transactions', authenticateToken, (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM coin_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.user.id);

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('获取交易记录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/recharge', authenticateToken, (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: '金额无效' });
    }

    db.prepare('BEGIN TRANSACTION').run();
    
    db.prepare('UPDATE users SET keep_coins = keep_coins + ? WHERE id = ?').run(amount, req.user.id);
    db.prepare(`
      INSERT INTO coin_transactions (user_id, type, amount, description)
      VALUES (?, 'recharge', ?, '充值')
    `).run(req.user.id, amount);

    db.prepare('COMMIT').run();

    const user = db.prepare('SELECT keep_coins FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, data: { balance: user.keep_coins }, message: '充值成功' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error('充值错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/withdraw', authenticateToken, (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: '金额无效' });
    }

    const user = db.prepare('SELECT keep_coins FROM users WHERE id = ?').get(req.user.id);
    if (user.keep_coins < amount) {
      return res.status(400).json({ success: false, message: '余额不足' });
    }

    db.prepare('BEGIN TRANSACTION').run();
    
    db.prepare('UPDATE users SET keep_coins = keep_coins - ? WHERE id = ?').run(amount, req.user.id);
    db.prepare(`
      INSERT INTO coin_transactions (user_id, type, amount, description)
      VALUES (?, 'withdraw', ?, '提现')
    `).run(req.user.id, amount);

    db.prepare('COMMIT').run();

    const updatedUser = db.prepare('SELECT keep_coins FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, data: { balance: updatedUser.keep_coins }, message: '提现成功' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error('提现错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
