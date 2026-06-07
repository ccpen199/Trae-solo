import express from 'express';
import db from '../db/index.js';
import { authenticate, requireRole } from '../middleware/oauth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/wallet', authenticate, (req, res) => {
  const wallet = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(req.user.id);
  if (!wallet) {
    db.prepare(`INSERT INTO wallets (user_id) VALUES (?)`).run(req.user.id);
    return res.json({ balance: 0, frozen_balance: 0, total_income: 0, total_withdraw: 0 });
  }
  res.json(wallet);
});

router.get('/transactions', authenticate, (req, res) => {
  const { limit = 20, offset = 0, type } = req.query;

  let sql = `SELECT * FROM wallet_transactions WHERE user_id = ?`;
  const params = [req.user.id];

  if (type) {
    sql += ` AND type = ?`;
    params.push(type);
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const transactions = db.prepare(sql).all(...params);
  res.json(transactions);
});

router.post('/withdraw', authenticate, (req, res) => {
  const { amount, bank_card_info, withdraw_method, account } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const wallet = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(req.user.id);
  if (!wallet || wallet.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  const taxRate = 0.03;
  const taxAmount = Math.round(amount * taxRate * 100) / 100;
  const actualAmount = Math.round((amount - taxAmount) * 100) / 100;

  const now = Math.floor(Date.now() / 1000);
  const certificateNo = 'TAX' + now + uuidv4().substring(0, 8).toUpperCase();

  const final_bank_info = bank_card_info || (withdraw_method ? `${withdraw_method}:${account || ''}` : '');

  const withdrawTx = db.transaction(() => {
    const newBalance = Math.round((wallet.balance - amount) * 100) / 100;
    db.prepare(`UPDATE wallets SET balance = ?, total_withdraw = total_withdraw + ?, updated_at = ? WHERE user_id = ?`).run(
      newBalance, amount, now, req.user.id
    );

    const withdrawId = db.prepare(`INSERT INTO withdraw_requests (user_id, amount, bank_card_info, tax_amount, actual_amount) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, amount, final_bank_info, taxAmount, actualAmount
    ).lastInsertRowid;

    db.prepare(`INSERT INTO tax_records (user_id, withdraw_id, income_amount, tax_rate, tax_amount, certificate_no) VALUES (?, ?, ?, ?, ?, ?)`).run(
      req.user.id, withdrawId, amount, taxRate, taxAmount, certificateNo
    );

    db.prepare(`INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description) VALUES (?, 'withdraw', -?, ?, '提现申请')`).run(
      req.user.id, amount, newBalance
    );

    return { withdrawId, certificateNo, actualAmount, taxAmount };
  });

  const result = withdrawTx();
  res.json({ success: true, ...result });
});

router.get('/withdrawals', authenticate, (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const withdrawals = db.prepare(`SELECT * FROM withdraw_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(
    req.user.id, limit, offset
  );
  res.json(withdrawals);
});

router.get('/tax-records', authenticate, requireRole('rider', 'admin'), (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const records = db.prepare(`SELECT tr.*, wr.amount as withdraw_amount FROM tax_records tr LEFT JOIN withdraw_requests wr ON tr.withdraw_id = wr.id WHERE tr.user_id = ? ORDER BY tr.created_at DESC LIMIT ? OFFSET ?`).all(
    req.user.id, limit, offset
  );
  res.json(records);
});

router.get('/commission-rules', authenticate, (req, res) => {
  const rules = db.prepare(`SELECT * FROM commission_rules ORDER BY level ASC`).all();
  res.json(rules);
});

router.post('/withdraw/:id/process', authenticate, requireRole('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const now = Math.floor(Date.now() / 1000);

  const withdraw = db.prepare(`SELECT * FROM withdraw_requests WHERE id = ?`).get(id);
  if (!withdraw || withdraw.status !== 'pending') {
    return res.status(400).json({ error: 'Invalid withdraw request' });
  }

  db.prepare(`UPDATE withdraw_requests SET status = 'processed', processed_at = ? WHERE id = ?`).run(now, id);
  res.json({ success: true });
});

export default router;
