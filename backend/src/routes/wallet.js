const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne, getAll, db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const runTransaction = (fn) => {
  const execTransaction = db.transaction(fn);
  return execTransaction();
};

router.post('/recharge', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '充值金额必须大于0'
      });
    }

    runTransaction(() => {
      runQuery(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amount, userId]
      );

      const transactionId = uuidv4();
      runQuery(
        'INSERT INTO transactions (id, user_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?, ?)',
        [transactionId, userId, 'recharge', amount, 'completed', `充值 ${amount} 元`]
      );
    });

    const user = await getOne('SELECT balance FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      data: { balance: user.balance },
      message: '充值成功'
    });
  } catch (error) {
    console.error('Recharge error:', error);
    res.status(500).json({
      success: false,
      message: '充值失败'
    });
  }
});

router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    const user = await getOne('SELECT balance, alipay_account FROM users WHERE id = ?', [userId]);

    if (!user.alipay_account) {
      return res.status(400).json({
        success: false,
        message: '请先绑定支付宝'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '提现金额必须大于0'
      });
    }

    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: '余额不足'
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: '最低提现金额为1元'
      });
    }

    runTransaction(() => {
      runQuery(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [amount, userId]
      );

      const transactionId = uuidv4();
      runQuery(
        'INSERT INTO transactions (id, user_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?, ?)',
        [transactionId, userId, 'withdraw', amount, 'pending', `提现 ${amount} 元`]
      );
    });

    const updatedUser = await getOne('SELECT balance FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      data: { balance: updatedUser.balance },
      message: '提现申请已提交，预计1-3个工作日到账'
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({
      success: false,
      message: '提现失败'
    });
  }
});

router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let sql = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const transactions = await getAll(sql, params);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: '获取交易记录失败'
    });
  }
});

module.exports = router;
