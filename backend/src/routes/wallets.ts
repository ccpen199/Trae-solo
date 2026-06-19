import { Router } from 'express';
import { getDb } from '../database';
import { verifyToken } from '../middleware/auth';
import type { AuthenticatedRequest, Wallet, WalletTransaction, RiskControl } from '../types';

const router = Router();

router.get('/my', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const db = getDb();
  let wallet = db.prepare('SELECT * FROM wallets WHERE resident_id = ?').get(authReq.user!.id) as Wallet | undefined;

  if (!wallet) {
    db.prepare('INSERT INTO wallets (resident_id, balance, total_earned) VALUES (?, 0, 0)').run(authReq.user!.id);
    wallet = db.prepare('SELECT * FROM wallets WHERE resident_id = ?').get(authReq.user!.id) as Wallet;
  }

  res.json({ success: true, data: wallet });
});

router.get('/transactions', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const db = getDb();
  const wallet = db.prepare('SELECT * FROM wallets WHERE resident_id = ?').get(authReq.user!.id) as Wallet | undefined;

  if (!wallet) {
    res.json({ success: true, data: { items: [], total: 0, page, limit, totalPages: 0 } });
    return;
  }

  const total = (db.prepare('SELECT COUNT(*) as cnt FROM wallet_transactions WHERE wallet_id = ?').get(wallet.id) as any).cnt;
  const transactions = db.prepare(
    'SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(wallet.id, limit, offset);

  res.json({
    success: true,
    data: { items: transactions, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

router.post('/withdraw', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ success: false, error: '提现金额必须大于0' });
    return;
  }

  const db = getDb();
  const wallet = db.prepare('SELECT * FROM wallets WHERE resident_id = ?').get(authReq.user!.id) as Wallet | undefined;

  if (!wallet) {
    res.status(404).json({ success: false, error: '钱包不存在' });
    return;
  }

  if (wallet.balance < amount) {
    res.status(400).json({ success: false, error: '余额不足' });
    return;
  }

  const riskControls = db.prepare('SELECT * FROM risk_controls WHERE resident_id = ? AND is_triggered = 0').all(authReq.user!.id) as RiskControl[];

  for (const rule of riskControls) {
    if (rule.rule_type === 'daily_withdraw_limit') {
      const limit = parseFloat(rule.rule_value);
      const today = new Date().toISOString().split('T')[0];
      const todayWithdrawn = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM wallet_transactions wt JOIN wallets w ON wt.wallet_id = w.id WHERE w.resident_id = ? AND wt.type = 'withdrawal' AND date(wt.created_at) = ?"
      ).get(authReq.user!.id, today) as { total: number };

      if (todayWithdrawn.total + amount > limit) {
        db.prepare('UPDATE risk_controls SET is_triggered = 1, triggered_at = datetime(\'now\') WHERE id = ?').run(rule.id);
        res.status(400).json({ success: false, error: `超出每日提现限额 ${limit} 元` });
        return;
      }
    }

    if (rule.rule_type === 'anti_money_laundering') {
      const threshold = parseFloat(rule.rule_value);
      if (amount >= threshold) {
        db.prepare('UPDATE risk_controls SET is_triggered = 1, triggered_at = datetime(\'now\') WHERE id = ?').run(rule.id);
        db.prepare(
          `INSERT INTO fraud_logs (entity_type, entity_id, action, actor_id, actor_role, detail) VALUES ('wallet', ?, 'aml_trigger', ?, ?, ?)`
        ).run(wallet.id, authReq.user!.id, authReq.user!.role, `提现金额${amount}触发反洗钱阈值${threshold}`);
        res.status(400).json({ success: false, error: '提现金额触发反洗钱审查，请联系管理员' });
        return;
      }
    }

    if (rule.rule_type === 'frequency_limit') {
      const maxCount = parseInt(rule.rule_value);
      const today = new Date().toISOString().split('T')[0];
      const todayCount = db.prepare(
        "SELECT COUNT(*) as cnt FROM wallet_transactions wt JOIN wallets w ON wt.wallet_id = w.id WHERE w.resident_id = ? AND wt.type = 'withdrawal' AND date(wt.created_at) = ?"
      ).get(authReq.user!.id, today) as { cnt: number };

      if (todayCount.cnt >= maxCount) {
        db.prepare('UPDATE risk_controls SET is_triggered = 1, triggered_at = datetime(\'now\') WHERE id = ?').run(rule.id);
        res.status(400).json({ success: false, error: `今日提现次数已达上限 ${maxCount} 次` });
        return;
      }
    }
  }

  const transaction = db.transaction(() => {
    db.prepare('UPDATE wallets SET balance = balance - ?, frozen_amount = frozen_amount + ?, total_withdrawn = total_withdrawn + ? WHERE id = ?').run(amount, amount, amount, wallet.id);

    db.prepare(
      `INSERT INTO wallet_transactions (wallet_id, type, amount, description) VALUES (?, 'withdrawal', ?, ?)`
    ).run(wallet.id, amount, `提现${amount}元`);

    db.prepare(
      `INSERT INTO fraud_logs (entity_type, entity_id, action, actor_id, actor_role, ip_address) VALUES ('wallet', ?, 'withdraw', ?, ?, ?)`
    ).run(wallet.id, authReq.user!.id, authReq.user!.role, req.ip);
  });

  transaction();

  const updatedWallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(wallet.id);
  res.json({ success: true, data: updatedWallet });
});

export default router;
