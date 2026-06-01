import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/balance', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const account = db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(req.user!.id);

    res.json({
      success: true,
      data: { account },
    });
  } catch (error) {
    console.error('获取账户余额错误:', error);
    res.status(500).json({ success: false, error: '获取账户余额失败' });
  }
});

router.get('/payments', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE p.user_id = ?';
    const params: any[] = [req.user!.id];

    if (type) {
      whereClause += ' AND p.type = ?';
      params.push(type);
    }

    const payments = db.prepare(`
      SELECT p.*, o.order_no, o.title as order_title
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM payments p ${whereClause}
    `).get(...params) as { total: number };

    res.json({
      success: true,
      data: {
        list: payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取支付记录错误:', error);
    res.status(500).json({ success: false, error: '获取支付记录失败' });
  }
});

router.get('/refunds', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE r.user_id = ?';
    const params: any[] = [req.user!.id];

    if (status) {
      whereClause += ' AND r.status = ?';
      params.push(status);
    }

    const refunds = db.prepare(`
      SELECT r.*, o.order_no, o.title as order_title
      FROM refunds r
      LEFT JOIN orders o ON r.order_id = o.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM refunds r ${whereClause}
    `).get(...params) as { total: number };

    res.json({
      success: true,
      data: {
        list: refunds,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取退款记录错误:', error);
    res.status(500).json({ success: false, error: '获取退款记录失败' });
  }
});

router.post('/recharge', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: '充值金额必须大于0' });
      return;
    }

    db.prepare('UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(
      amount,
      req.user!.id
    );

    const transactionNo = 'RCH' + Date.now() + Math.floor(Math.random() * 1000);
    db.prepare(`
      INSERT INTO payments (order_id, user_id, amount, type, payment_method, transaction_no, status, paid_at)
      VALUES (NULL, ?, ?, 'recharge', 'online', ?, 'success', CURRENT_TIMESTAMP)
    `).run(req.user!.id, amount, transactionNo);

    res.json({ success: true, message: '充值成功' });
  } catch (error) {
    console.error('充值错误:', error);
    res.status(500).json({ success: false, error: '充值失败' });
  }
});

router.post('/withdraw', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: '提现金额必须大于0' });
      return;
    }

    const account = db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(req.user!.id) as any;
    if (!account || account.balance < amount) {
      res.status(400).json({ success: false, error: '账户余额不足' });
      return;
    }

    db.prepare('UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(
      amount,
      req.user!.id
    );

    const transactionNo = 'WTH' + Date.now() + Math.floor(Math.random() * 1000);
    db.prepare(`
      INSERT INTO payments (order_id, user_id, amount, type, payment_method, transaction_no, status, paid_at)
      VALUES (NULL, ?, ?, 'withdraw', 'bank_transfer', ?, 'success', CURRENT_TIMESTAMP)
    `).run(req.user!.id, amount, transactionNo);

    res.json({ success: true, message: '提现成功' });
  } catch (error) {
    console.error('提现错误:', error);
    res.status(500).json({ success: false, error: '提现失败' });
  }
});

router.get('/security', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare(
      'SELECT id, username, email, phone, real_name, id_card, is_verified, created_at FROM users WHERE id = ?'
    ).get(req.user!.id);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('获取安全设置错误:', error);
    res.status(500).json({ success: false, error: '获取安全设置失败' });
  }
});

router.put('/security/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bcrypt = await import('bcryptjs');
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      res.status(400).json({ success: false, error: '旧密码和新密码不能为空' });
      return;
    }

    if (new_password.length < 6) {
      res.status(400).json({ success: false, error: '新密码长度不能少于6位' });
      return;
    }

    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user!.id) as any;
    const isValid = await bcrypt.compare(old_password, user.password);

    if (!isValid) {
      res.status(400).json({ success: false, error: '旧密码不正确' });
      return;
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      hashedPassword,
      req.user!.id
    );

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ success: false, error: '修改密码失败' });
  }
});

export default router;
