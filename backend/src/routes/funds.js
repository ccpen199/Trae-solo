const express = require('express');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRole } = require('./auth');
const AuditLogger = require('../audit-logger');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole('investor'), async (req, res) => {
  try {
    const funds = db.prepare('SELECT * FROM funds WHERE user_id = ?').get(req.user.id);
    
    if (!funds) {
      return res.status(404).json({ error: '资金账户不存在' });
    }

    const positions = db.prepare(
      'SELECT SUM(market_value) as total_market_value FROM positions WHERE user_id = ?'
    ).get(req.user.id);

    const totalMarketValue = positions.total_market_value || 0;
    const totalAssets = funds.total_balance + totalMarketValue;

    res.json({
      ...funds,
      total_market_value: totalMarketValue,
      total_assets: totalAssets
    });
  } catch (error) {
    console.error('获取资金账户错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/all', requireRole('exchange_admin', 'financial_settler'), async (req, res) => {
  try {
    const { userId } = req.query;
    
    let query = `
      SELECT f.*, u.username, u.name as user_name
      FROM funds f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ' AND f.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY f.user_id';

    const funds = db.prepare(query).all(...params);
    res.json(funds);
  } catch (error) {
    console.error('获取全部资金账户错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/deposit', requireRole('investor'), async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '充值金额必须大于0' });
    }

    const funds = db.prepare('SELECT * FROM funds WHERE user_id = ?').get(req.user.id);
    
    if (!funds) {
      return res.status(404).json({ error: '资金账户不存在' });
    }

    db.prepare(`
      UPDATE funds 
      SET total_balance = total_balance + ?, 
          available_balance = available_balance + ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(amount, amount, Date.now(), req.user.id);

    AuditLogger.log('FUND_DEPOSIT', 'fund', funds.id, {
      amount,
      new_balance: funds.total_balance + amount
    }, req.user, req);

    res.json({
      message: '充值成功',
      amount,
      new_balance: funds.total_balance + amount
    });
  } catch (error) {
    console.error('充值错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/withdraw', requireRole('investor'), async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '提现金额必须大于0' });
    }

    const funds = db.prepare('SELECT * FROM funds WHERE user_id = ?').get(req.user.id);
    
    if (!funds) {
      return res.status(404).json({ error: '资金账户不存在' });
    }

    if (funds.available_balance < amount) {
      return res.status(400).json({ error: '可用余额不足' });
    }

    db.prepare(`
      UPDATE funds 
      SET total_balance = total_balance - ?, 
          available_balance = available_balance - ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(amount, amount, Date.now(), req.user.id);

    AuditLogger.log('FUND_WITHDRAW', 'fund', funds.id, {
      amount,
      new_balance: funds.total_balance - amount
    }, req.user, req);

    res.json({
      message: '提现成功',
      amount,
      new_balance: funds.total_balance - amount
    });
  } catch (error) {
    console.error('提现错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
