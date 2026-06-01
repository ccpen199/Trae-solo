const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/balance', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT balance, total_invest, total_earnings FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get balance error:', error);
    res.json({ success: false, message: '获取余额失败' });
  }
});

router.post('/recharge', authenticateToken, (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.json({ success: false, message: '金额必须大于0' });
    }

    const updateUserStmt = db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?');
    updateUserStmt.run(amount, userId);

    const insertTransactionStmt = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description)
      VALUES (?, ?, ?, ?)
    `);
    insertTransactionStmt.run(userId, 'recharge', amount, '账户充值');

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: '充值成功',
      data: { balance: user.balance }
    });
  } catch (error) {
    console.error('Recharge error:', error);
    res.json({ success: false, message: '充值失败' });
  }
});

router.post('/withdraw', authenticateToken, (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.json({ success: false, message: '金额必须大于0' });
    }

    if (amount > req.user.balance) {
      return res.json({ success: false, message: '余额不足' });
    }

    const updateUserStmt = db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?');
    updateUserStmt.run(amount, userId);

    const insertTransactionStmt = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description)
      VALUES (?, ?, ?, ?)
    `);
    insertTransactionStmt.run(userId, 'withdraw', amount, '账户提现');

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: '提现成功',
      data: { balance: user.balance }
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.json({ success: false, message: '提现失败' });
  }
});

router.get('/transactions', authenticateToken, (req, res) => {
  try {
    const { type, page = 1, pageSize = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const transactions = db.prepare(query).all(...params);

    let countQuery = 'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?';
    const countParams = [userId];
    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }

    const total = db.prepare(countQuery).get(...countParams).count;

    res.json({
      success: true,
      data: {
        list: transactions,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.json({ success: false, message: '获取交易记录失败' });
  }
});

router.get('/investments', authenticateToken, (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT i.*, p.title, p.interest_rate, p.term, p.term_unit
      FROM investments i
      JOIN projects p ON i.project_id = p.id
      WHERE i.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.invest_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const investments = db.prepare(query).all(...params);

    let countQuery = 'SELECT COUNT(*) as count FROM investments WHERE user_id = ?';
    const countParams = [userId];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const total = db.prepare(countQuery).get(...countParams).count;

    res.json({
      success: true,
      data: {
        list: investments,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get investments error:', error);
    res.json({ success: false, message: '获取投资记录失败' });
  }
});

router.get('/repayment-plans', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const plans = db.prepare(`
      SELECT rp.*, p.title
      FROM repayment_plans rp
      JOIN investments i ON rp.investment_id = i.id
      JOIN projects p ON i.project_id = p.id
      WHERE rp.user_id = ?
      ORDER BY rp.plan_date ASC
    `).all(userId);

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Get repayment plans error:', error);
    res.json({ success: false, message: '获取回款计划失败' });
  }
});

module.exports = router;
