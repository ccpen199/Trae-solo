import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
  
  if (!user) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, phone: user.phone, role: user.role, nickname: user.nickname },
    process.env.JWT_SECRET || 'charging_platform_secret_key_2024',
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      role: user.role,
      balance: user.balance,
      vehicle_info: user.vehicle_info,
    },
  });
});

router.post('/register', (req: Request, res: Response) => {
  const { phone, password, nickname, vehicle_info } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(400).json({ error: '该手机号已注册' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (phone, password, nickname, role, balance, vehicle_info)
    VALUES (?, ?, ?, 'owner', 0, ?)
  `).run(phone, hashedPassword, nickname || phone, vehicle_info || null);

  const userId = result.lastInsertRowid as number;
  const token = jwt.sign(
    { id: userId, phone, role: 'owner', nickname: nickname || phone },
    process.env.JWT_SECRET || 'charging_platform_secret_key_2024',
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: userId,
      phone,
      nickname: nickname || phone,
      role: 'owner',
      balance: 0,
      vehicle_info,
    },
  });
});

router.get('/profile', authenticate, (req: Request, res: Response) => {
  const user = db.prepare(`
    SELECT id, phone, nickname, role, balance, vehicle_info, created_at 
    FROM users WHERE id = ?
  `).get(req.user!.id);
  
  res.json({ user });
});

router.put('/profile', authenticate, (req: Request, res: Response) => {
  const { nickname, vehicle_info } = req.body;
  db.prepare(`
    UPDATE users SET nickname = ?, vehicle_info = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nickname, vehicle_info, req.user!.id);
  
  const user = db.prepare(`
    SELECT id, phone, nickname, role, balance, vehicle_info, created_at 
    FROM users WHERE id = ?
  `).get(req.user!.id);
  
  res.json({ user });
});

router.post('/recharge', authenticate, (req: Request, res: Response) => {
  const { amount, payment_method = 'wechat' } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '充值金额必须大于0' });
  }

  const transaction = db.transaction(() => {
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user!.id) as { balance: number };
    const newBalance = user.balance + amount;
    
    db.prepare('UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newBalance, req.user!.id);
    
    const transactionNo = `TX${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    db.prepare(`
      INSERT INTO transactions (transaction_no, user_id, type, amount, balance_before, balance_after, payment_method, status)
      VALUES (?, ?, 'recharge', ?, ?, ?, ?, 'success')
    `).run(transactionNo, req.user!.id, amount, user.balance, newBalance, payment_method);
    
    return { newBalance, transactionNo };
  });

  try {
    const result = transaction();
    res.json({ balance: result.newBalance, transaction_no: result.transactionNo });
  } catch (err) {
    res.status(500).json({ error: '充值失败' });
  }
});

export default router;
