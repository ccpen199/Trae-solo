import express from 'express';
import { db } from '../database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/recharge', authMiddleware, (req, res) => {
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '充值金额无效' });
  }

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  
  db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user.id);
    
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
      VALUES (?, 'recharge', ?, ?, ?, '账户充值')
    `).run(req.user.id, amount, user.balance, user.balance + amount);
  })();

  res.json({ success: true, newBalance: user.balance + amount });
});

router.post('/withdraw', authMiddleware, (req, res) => {
  const { amount, accountInfo } = req.body;
  
  if (!amount || amount < 1) {
    return res.status(400).json({ error: '最低提现金额为1元' });
  }

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if (user.balance < amount) {
    return res.status(400).json({ error: '余额不足' });
  }

  let feeRate = 0.01;
  if (amount < 50) feeRate = 0.03;
  else if (amount < 100) feeRate = 0.02;
  
  const fee = amount * feeRate;
  const actualAmount = amount - fee;

  db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
    
    db.prepare(`
      INSERT INTO withdrawals (user_id, amount, fee, actual_amount, account_info, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(req.user.id, amount, fee, actualAmount, JSON.stringify(accountInfo || {}));

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
      VALUES (?, 'withdraw', -?, ?, ?, '申请提现')
    `).run(req.user.id, amount, user.balance, user.balance - amount);
  })();

  res.json({ success: true });
});

router.get('/transactions', authMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const transactions = db.prepare(`
    SELECT * FROM transactions 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?').get(req.user.id).count;

  res.json({ transactions, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/withdrawals', authMiddleware, (req, res) => {
  const withdrawals = db.prepare(`
    SELECT * FROM withdrawals 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);

  res.json(withdrawals);
});

router.get('/admin/withdrawals', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT w.*, u.username 
    FROM withdrawals w
    LEFT JOIN users u ON w.user_id = u.id
  `;
  let params = [];
  
  if (status) {
    sql += ' WHERE w.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY w.created_at DESC';

  const withdrawals = db.prepare(sql).all(...params);
  res.json(withdrawals);
});

router.post('/admin/withdrawals/:id/audit', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.body;
  
  const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(req.params.id);
  if (!withdrawal || withdrawal.status !== 'pending') {
    return res.status(400).json({ error: '无效的提现申请' });
  }

  if (status === 'approved') {
    db.prepare('UPDATE withdrawals SET status = ?, audit_by = ?, audit_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('approved', req.user.id, req.params.id);
  } else {
    db.transaction(() => {
      db.prepare('UPDATE withdrawals SET status = ?, audit_by = ?, audit_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('rejected', req.user.id, req.params.id);
      
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(withdrawal.amount, withdrawal.user_id);
      
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(withdrawal.user_id);
      db.prepare(`
        INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
        VALUES (?, 'refund', ?, ?, ?, '提现拒绝退款')
      `).run(withdrawal.user_id, withdrawal.amount, user.balance - withdrawal.amount, user.balance);
    })();
  }

  res.json({ success: true });
});

export default router;
