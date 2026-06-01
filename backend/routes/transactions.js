const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

router.post('/initiate', (req, res) => {
  try {
    const { payerId, payeeId, amount, paymentMethod, description, qrCodeId } = req.body;
    
    if (!payerId || !payeeId || !amount || !paymentMethod) {
      return res.error('参数不完整');
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0.01 || numAmount > 5000) {
      return res.error('金额必须在0.01元到5000元之间');
    }
    
    if (!['balance', 'bank_card'].includes(paymentMethod)) {
      return res.error('不支持的支付方式');
    }
    
    if (payerId === payeeId) {
      return res.error('不能向自己转账');
    }
    
    const payer = db.prepare('SELECT balance FROM users WHERE id = ?').get(payerId);
    const payee = db.prepare('SELECT id FROM users WHERE id = ?').get(payeeId);
    
    if (!payer || !payee) {
      return res.error('用户不存在');
    }
    
    if (paymentMethod === 'balance' && payer.balance < numAmount) {
      return res.error('零钱余额不足');
    }
    
    const transactionId = uuidv4();
    db.prepare(`
      INSERT INTO transactions (id, payer_id, payee_id, amount, payment_method, status, description, qr_code_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(transactionId, payerId, payeeId, numAmount, paymentMethod, 'pending', description || '', qrCodeId || null);
    
    res.success({ transactionId, status: 'pending' }, '交易已发起');
  } catch (err) {
    res.error('发起交易失败', err.message);
  }
});

router.post('/:transactionId/confirm', (req, res) => {
  const { transactionId } = req.params;
  
  try {
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transactionId);
    
    if (!transaction) {
      return res.error('交易不存在', null, 404);
    }
    
    if (transaction.status !== 'pending') {
      return res.error('交易状态异常');
    }
    
    const now = Date.now();
    
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(transaction.amount, transaction.payer_id);
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(transaction.amount, transaction.payee_id);
      
      db.prepare(`
        UPDATE transactions 
        SET status = 'success', completed_at = ?
        WHERE id = ?
      `).run(now, transactionId);
      
      const payer = db.prepare('SELECT name FROM users WHERE id = ?').get(transaction.payer_id);
      const notificationId = uuidv4();
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, content)
        VALUES (?, ?, ?, ?, ?)
      `).run(notificationId, transaction.payee_id, 'payment', '收款成功', `收到 ${payer?.name || '用户'} 转账 ¥${transaction.amount.toFixed(2)}`);
      
      db.prepare('COMMIT').run();
      
      const updatedPayer = db.prepare('SELECT balance FROM users WHERE id = ?').get(transaction.payer_id);
      
      res.success({ 
        transactionId, 
        status: 'success',
        newBalance: updatedPayer.balance
      }, '支付成功');
    } catch (e) {
      db.prepare('ROLLBACK').run();
      throw e;
    }
  } catch (err) {
    db.prepare('UPDATE transactions SET status = ?, error_message = ? WHERE id = ?').run('failed', err.message, transactionId);
    res.error('支付失败', err.message);
  }
});

router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'all', limit = 50 } = req.query;
    
    let query = `
      SELECT t.*, 
        p.name as payer_name, p.avatar as payer_avatar,
        e.name as payee_name, e.avatar as payee_avatar
      FROM transactions t
      LEFT JOIN users p ON t.payer_id = p.id
      LEFT JOIN users e ON t.payee_id = e.id
      WHERE (t.payer_id = ? OR t.payee_id = ?)
    `;
    
    const params = [userId, userId];
    
    if (type === 'paid') {
      query += ' AND t.payer_id = ?';
      params.push(userId);
    } else if (type === 'received') {
      query += ' AND t.payee_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY t.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const transactions = db.prepare(query).all(...params);
    
    res.success(transactions.map(t => ({
      ...t,
      direction: t.payer_id === userId ? 'out' : 'in',
      otherParty: t.payer_id === userId 
        ? { id: t.payee_id, name: t.payee_name, avatar: t.payee_avatar }
        : { id: t.payer_id, name: t.payer_name, avatar: t.payer_avatar }
    })));
  } catch (err) {
    res.error('获取交易记录失败', err.message);
  }
});

router.get('/:transactionId', (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = db.prepare(`
      SELECT t.*, 
        p.name as payer_name, p.avatar as payer_avatar,
        e.name as payee_name, e.avatar as payee_avatar
      FROM transactions t
      LEFT JOIN users p ON t.payer_id = p.id
      LEFT JOIN users e ON t.payee_id = e.id
      WHERE t.id = ?
    `).get(transactionId);
    
    if (!transaction) {
      return res.error('交易不存在', null, 404);
    }
    
    res.success(transaction);
  } catch (err) {
    res.error('获取交易详情失败', err.message);
  }
});

router.get('/user/:userId/pending', (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = db.prepare(`
      SELECT t.*,
        p.name as payer_name, p.avatar as payer_avatar
      FROM transactions t
      LEFT JOIN users p ON t.payer_id = p.id
      WHERE t.payee_id = ? AND t.status = 'pending'
      ORDER BY t.created_at DESC
    `).all(userId);
    
    res.success(transactions);
  } catch (err) {
    res.error('获取待处理交易失败', err.message);
  }
});

router.get('/user/:userId/summary', (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as totalCount,
        SUM(CASE WHEN payee_id = ? AND status = 'success' THEN amount ELSE 0 END) as totalReceived,
        SUM(CASE WHEN payer_id = ? AND status = 'success' THEN amount ELSE 0 END) as totalPaid,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successCount,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedCount
      FROM transactions
      WHERE (payer_id = ? OR payee_id = ?)
    `;
    
    const params = [userId, userId, userId, userId];
    
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(parseInt(startDate));
    }
    
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(parseInt(endDate));
    }
    
    const summary = db.prepare(query).get(...params);
    res.success(summary);
  } catch (err) {
    res.error('获取交易汇总失败', err.message);
  }
});

module.exports = router;
