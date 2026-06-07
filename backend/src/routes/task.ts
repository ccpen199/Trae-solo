import { Router, Request, Response } from 'express';
import { getDB } from '../db/init';
import { auth } from '../middleware/auth';
import { validateTaskCompletion } from '../services/antiFraud';

const router = Router();

router.get('/', auth, (req: Request, res: Response) => {
  const db = getDB();
  const taskType = req.query.type as string;

  let where = "WHERE status = 'active'";
  const params: any[] = [];

  if (taskType) {
    where += ' AND task_type = ?';
    params.push(taskType);
  }

  const tasks = db.prepare(`SELECT * FROM tasks ${where} ORDER BY created_at DESC`).all(...params);

  const tasksWithStatus = tasks.map((task: any) => {
    const userTask = db.prepare('SELECT status FROM user_tasks WHERE user_id = ? AND task_id = ?').get(req.user!.id, task.id) as any;
    return { ...task, user_status: userTask?.status || 'available' };
  });

  res.json({ data: tasksWithStatus });
});

router.get('/:id', auth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const userTask = db.prepare('SELECT * FROM user_tasks WHERE user_id = ? AND task_id = ?').get(req.user!.id, id) as any;
  res.json({ ...task, user_status: userTask?.status || 'available', user_task: userTask || null });
});

router.post('/:id/complete', auth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);
  const { device_fingerprint } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || '';

  const validation = validateTaskCompletion(req.user!.id, id, device_fingerprint, ipAddress);
  if (!validation.valid) {
    res.status(400).json({ error: validation.reason });
    return;
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;

  const insertUserTask = db.transaction(() => {
    db.prepare(`
      INSERT INTO user_tasks (user_id, task_id, status, completed_at, lili_beans_earned, device_fingerprint, ip_address)
      VALUES (?, ?, 'completed', CURRENT_TIMESTAMP, ?, ?, ?)
    `).run(req.user!.id, id, task.lili_beans_reward, device_fingerprint || null, ipAddress);

    db.prepare('UPDATE tasks SET current_completions = current_completions + 1 WHERE id = ?').run(id);
  });

  try {
    insertUserTask();
    res.json({ success: true, lili_beans_earned: task.lili_beans_reward });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Task already completed' });
      return;
    }
    throw err;
  }
});

router.post('/:id/claim', auth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);

  const userTask = db.prepare('SELECT * FROM user_tasks WHERE user_id = ? AND task_id = ?').get(req.user!.id, id) as any;
  if (!userTask) {
    res.status(404).json({ error: 'Task completion not found' });
    return;
  }
  if (userTask.status === 'claimed') {
    res.status(400).json({ error: 'Reward already claimed' });
    return;
  }
  if (userTask.status !== 'completed') {
    res.status(400).json({ error: 'Task not completed yet' });
    return;
  }

  const claimReward = db.transaction(() => {
    db.prepare("UPDATE user_tasks SET status = 'claimed' WHERE id = ?").run(userTask.id);

    const beans = db.prepare('SELECT * FROM user_lili_beans WHERE user_id = ?').get(req.user!.id) as any;
    if (!beans) {
      db.prepare('INSERT INTO user_lili_beans (user_id, balance, total_earned, total_spent) VALUES (?, ?, ?, 0)').run(req.user!.id, userTask.lili_beans_earned, userTask.lili_beans_earned);
    } else {
      db.prepare('UPDATE user_lili_beans SET balance = balance + ?, total_earned = total_earned + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
        .run(userTask.lili_beans_earned, userTask.lili_beans_earned, req.user!.id);
    }

    db.prepare(`
      INSERT INTO bean_transactions (user_id, amount, transaction_type, reference_id, description)
      VALUES (?, ?, 'task_reward', ?, ?)
    `).run(req.user!.id, userTask.lili_beans_earned, id, 'Task reward claimed');
  });

  claimReward();
  res.json({ success: true, lili_beans_earned: userTask.lili_beans_earned });
});

router.get('/beans/balance', auth, (req: Request, res: Response) => {
  const db = getDB();
  const beans = db.prepare('SELECT * FROM user_lili_beans WHERE user_id = ?').get(req.user!.id) as any;
  if (!beans) {
    res.json({ balance: 0, total_earned: 0, total_spent: 0, phone_bill_exchange_rate: 100 });
    return;
  }
  res.json(beans);
});

router.get('/beans/transactions', auth, (req: Request, res: Response) => {
  const db = getDB();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const total = (db.prepare('SELECT COUNT(*) as count FROM bean_transactions WHERE user_id = ?').get(req.user!.id) as any).count;
  const transactions = db.prepare(`
    SELECT * FROM bean_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.user!.id, limit, offset);

  res.json({ data: transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.post('/beans/exchange', auth, (req: Request, res: Response) => {
  const db = getDB();
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Valid amount required' });
    return;
  }

  const beans = db.prepare('SELECT * FROM user_lili_beans WHERE user_id = ?').get(req.user!.id) as any;
  if (!beans || beans.balance < amount) {
    res.status(400).json({ error: 'Insufficient balance' });
    return;
  }

  const exchangeRate = beans.phone_bill_exchange_rate || 100;
  const phoneBillYuan = Math.floor(amount / exchangeRate * 100) / 100;

  if (phoneBillYuan < 1) {
    res.status(400).json({ error: 'Minimum exchange is 1 yuan' });
    return;
  }

  const actualBeans = Math.ceil(phoneBillYuan * exchangeRate);

  const exchange = db.transaction(() => {
    db.prepare('UPDATE user_lili_beans SET balance = balance - ?, total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(actualBeans, actualBeans, req.user!.id);

    db.prepare(`
      INSERT INTO bean_transactions (user_id, amount, transaction_type, description)
      VALUES (?, ?, 'exchange', ?)
    `).run(req.user!.id, -actualBeans, `Exchange ${actualBeans} beans for ${phoneBillYuan} yuan phone bill`);
  });

  exchange();
  res.json({ success: true, beans_spent: actualBeans, phone_bill_yuan: phoneBillYuan, exchange_rate: exchangeRate });
});

router.get('/beans/exchange-rate', auth, (req: Request, res: Response) => {
  const db = getDB();
  const beans = db.prepare('SELECT phone_bill_exchange_rate FROM user_lili_beans WHERE user_id = ?').get(req.user!.id) as any;
  const rate = beans?.phone_bill_exchange_rate || 100;
  res.json({ rate, description: `${rate} beans = 1 yuan phone bill` });
});

export default router;
