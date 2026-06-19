import { Router } from 'express';
import { getDb } from '../database';
import { verifyToken, requireCommunity } from '../middleware/auth';
import type { AuthenticatedRequest, Task, Wallet } from '../types';

const router = Router();

router.get('/', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const db = getDb();
  const tasks = db.prepare('SELECT * FROM tasks WHERE community_id = ? AND status = ?').all(authReq.community!.id, 'active');
  res.json({ success: true, data: tasks });
});

router.post('/check-in', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const db = getDb();

  const task = db.prepare('SELECT * FROM tasks WHERE community_id = ? AND type = ? AND status = ?').get(authReq.community!.id, 'check_in', 'active') as Task | undefined;

  if (!task) {
    res.status(404).json({ success: false, error: '签到任务不存在' });
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare(
    "SELECT * FROM task_completions WHERE task_id = ? AND resident_id = ? AND date(created_at) = ?"
  ).get(task.id, authReq.user!.id, today);

  if (existing) {
    res.status(400).json({ success: false, error: '今日已签到' });
    return;
  }

  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO task_completions (task_id, resident_id, reward_amount) VALUES (?, ?, ?)').run(task.id, authReq.user!.id, task.reward_amount);

    const wallet = db.prepare('SELECT * FROM wallets WHERE resident_id = ?').get(authReq.user!.id) as Wallet | undefined;
    if (wallet) {
      db.prepare('UPDATE wallets SET balance = balance + ?, total_earned = total_earned + ? WHERE resident_id = ?').run(task.reward_amount, task.reward_amount, authReq.user!.id);
      db.prepare(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, ref_type, ref_id, description) VALUES (?, 'red_packet', ?, 'task', ?, ?)`
      ).run(wallet.id, task.reward_amount, task.id, '每日签到奖励');
    }

    db.prepare(
      `INSERT INTO red_packets (community_id, resident_id, amount, reason, status, expires_at) VALUES (?, ?, ?, ?, 'issued', datetime('now', '+7 days'))`
    ).run(authReq.community!.id, authReq.user!.id, task.reward_amount, '每日签到奖励');
  });

  transaction();

  res.json({ success: true, data: { message: '签到成功', reward: task.reward_amount } });
});

router.post('/:id/complete', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND status = ?').get(req.params.id, 'active') as Task | undefined;

  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }

  if (task.community_id !== authReq.community!.id) {
    res.status(403).json({ success: false, error: '不属于当前社区的任务' });
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayCompletions = db.prepare(
    "SELECT COUNT(*) as cnt FROM task_completions WHERE task_id = ? AND resident_id = ? AND date(created_at) = ?"
  ).get(task.id, authReq.user!.id, today) as { cnt: number };

  if (todayCompletions.cnt >= task.daily_limit) {
    res.status(400).json({ success: false, error: '今日已达任务完成上限' });
    return;
  }

  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO task_completions (task_id, resident_id, reward_amount) VALUES (?, ?, ?)').run(task.id, authReq.user!.id, task.reward_amount);

    const wallet = db.prepare('SELECT * FROM wallets WHERE resident_id = ?').get(authReq.user!.id) as Wallet | undefined;
    if (wallet) {
      db.prepare('UPDATE wallets SET balance = balance + ?, total_earned = total_earned + ? WHERE resident_id = ?').run(task.reward_amount, task.reward_amount, authReq.user!.id);
      db.prepare(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, ref_type, ref_id, description) VALUES (?, 'red_packet', ?, 'task', ?, ?)`
      ).run(wallet.id, task.reward_amount, task.id, task.title);
    }

    db.prepare(
      `INSERT INTO red_packets (community_id, resident_id, amount, reason, status, expires_at) VALUES (?, ?, ?, ?, 'issued', datetime('now', '+7 days'))`
    ).run(authReq.community!.id, authReq.user!.id, task.reward_amount, task.title);
  });

  transaction();

  res.json({ success: true, data: { message: '任务完成', reward: task.reward_amount } });
});

router.get('/my-completions', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as cnt FROM task_completions WHERE resident_id = ?').get(authReq.user!.id) as any).cnt;
  const completions = db.prepare(
    `SELECT tc.*, t.title as task_title, t.type as task_type FROM task_completions tc JOIN tasks t ON tc.task_id = t.id WHERE tc.resident_id = ? ORDER BY tc.created_at DESC LIMIT ? OFFSET ?`
  ).all(authReq.user!.id, limit, offset);

  res.json({
    success: true,
    data: { items: completions, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

export default router;
