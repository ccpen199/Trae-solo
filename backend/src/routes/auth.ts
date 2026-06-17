import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';

const router = Router();
export const JWT_SECRET = 'shanpao-secret';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.json({ code: 401, message: '未授权', data: null });
    return;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as unknown as { userId: string }).userId = decoded.userId;
    next();
  } catch (err) {
    res.json({ code: 401, message: 'Token无效或已过期', data: null });
  }
}

export function getUserId(req: Request): string {
  return (req as unknown as { userId: string }).userId;
}

function rowToUser(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id as string,
    phone: row.phone as string,
    nickname: row.nickname as string,
    avatar: row.avatar as string,
    realName: row.real_name as string,
    idCard: row.id_card as string,
    role: row.role as string,
    balance: row.balance as number,
    cityId: row.city_id as string,
    status: row.status as string,
    createdAt: row.created_at as string
  };
}

router.post('/login', (req, res) => {
  try {
    const { phone, password } = req.body as { phone: string; password: string };
    if (!phone || !password) {
      res.json({ code: 400, message: '手机号和密码不能为空', data: null });
      return;
    }
    const db = getDb();
    const userRow = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as Record<string, unknown> | undefined;
    if (!userRow) {
      res.json({ code: 401, message: '用户不存在', data: null });
      return;
    }
    const isValid = bcrypt.compareSync(password, userRow.password_hash as string);
    if (!isValid) {
      res.json({ code: 401, message: '密码错误', data: null });
      return;
    }
    if (userRow.status === 'frozen') {
      res.json({ code: 403, message: '账号已被冻结', data: null });
      return;
    }
    const token = jwt.sign({ userId: userRow.id as string }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ code: 0, message: 'ok', data: { token, user: rowToUser(userRow) } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/register', (req, res) => {
  try {
    const { phone, password, nickname, role, realName, idCard } = req.body as {
      phone: string; password: string; nickname?: string; role?: string; realName?: string; idCard?: string;
    };
    if (!phone || !password) {
      res.json({ code: 400, message: '手机号和密码不能为空', data: null });
      return;
    }
    const validRoles = ['user', 'rider', 'merchant'];
    const userRole = validRoles.includes(role || '') ? role : 'user';

    const db = getDb();
    const exists = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (exists) {
      res.json({ code: 400, message: '该手机号已注册', data: null });
      return;
    }
    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, phone, nickname, avatar, real_name, id_card, role, password_hash, balance, city_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, phone, nickname || '新用户', '', realName || '', idCard || '', userRole, hash, 0, null, 'normal', now);

    if (userRole === 'rider') {
      db.prepare(`
        INSERT INTO riders (id, user_id, level, total_orders, credit_score, fulfillment_rate, avg_rating, current_orders, online_status, accept_mode, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), id, 'bronze', 0, 100, 0, 0, 0, 'offline', 'grab', now);
    } else if (userRole === 'merchant') {
      db.prepare(`
        INSERT INTO merchants (id, user_id, shop_name, license_no, legal_person, id_card, category, audit_status, commission_rate, balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), id, nickname || '新商户', '', realName || '', idCard || '', '', 'pending', 0.1, 0);
    }

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ code: 0, message: 'ok', data: { token, user: rowToUser(userRow) } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/me', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!userRow) {
      res.json({ code: 404, message: '用户不存在', data: null });
      return;
    }
    res.json({ code: 0, message: 'ok', data: rowToUser(userRow) });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

export default router;
