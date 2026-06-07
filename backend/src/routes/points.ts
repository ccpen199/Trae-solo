import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/balance', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user!.id) as any;
    res.json({ success: true, data: { balance: user?.points || 0 } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/transactions', authMiddleware, (req: Request, res: Response) => {
  try {
    const { type, page = '1', pageSize = '10' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let countSql = 'SELECT COUNT(*) as total FROM point_transactions WHERE user_id = ?';
    let listSql = 'SELECT * FROM point_transactions WHERE user_id = ?';
    const params: any[] = [req.user!.id];

    if (type) { countSql += ' AND type = ?'; listSql += ' AND type = ?'; params.push(type); }

    listSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const total = (db.prepare(countSql).get(...params) as any).total;
    const transactions = db.prepare(listSql).all(...params, Number(pageSize), offset);

    res.json({
      success: true,
      data: { list: transactions, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/earn', authMiddleware, (req: Request, res: Response) => {
  try {
    const { points, reason } = req.body;
    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: '积分必须大于0' });
    }

    const currentBalance = (db.prepare('SELECT points FROM users WHERE id = ?').get(req.user!.id) as any).points;
    const newBalance = currentBalance + points;

    const updateBalance = db.prepare('UPDATE users SET points = ? WHERE id = ?');
    const insertTx = db.prepare('INSERT INTO point_transactions (user_id, points, type, reason, balance_after) VALUES (?, ?, ?, ?, ?)');

    const transaction = db.transaction(() => {
      updateBalance.run(newBalance, req.user!.id);
      const result = insertTx.run(req.user!.id, points, 'earn', reason || '节能奖励', newBalance);
      return result.lastInsertRowid;
    });

    const txId = transaction();
    const txRecord = db.prepare('SELECT * FROM point_transactions WHERE id = ?').get(txId);

    res.json({ success: true, data: { transaction: txRecord, newBalance } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/spend', authMiddleware, (req: Request, res: Response) => {
  try {
    const { points, reason } = req.body;
    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: '积分必须大于0' });
    }

    const currentBalance = (db.prepare('SELECT points FROM users WHERE id = ?').get(req.user!.id) as any).points;
    if (currentBalance < points) {
      return res.status(400).json({ success: false, message: '积分余额不足' });
    }

    const newBalance = currentBalance - points;

    const updateBalance = db.prepare('UPDATE users SET points = ? WHERE id = ?');
    const insertTx = db.prepare('INSERT INTO point_transactions (user_id, points, type, reason, balance_after) VALUES (?, ?, ?, ?, ?)');

    const transaction = db.transaction(() => {
      updateBalance.run(newBalance, req.user!.id);
      const result = insertTx.run(req.user!.id, points, 'spend', reason || '积分消费', newBalance);
      return result.lastInsertRowid;
    });

    const txId = transaction();
    const txRecord = db.prepare('SELECT * FROM point_transactions WHERE id = ?').get(txId);

    res.json({ success: true, data: { transaction: txRecord, newBalance } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
