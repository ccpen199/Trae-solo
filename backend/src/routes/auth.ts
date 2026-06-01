import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOne, runQuery } from '../database';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'daodao_accounting_jwt_secret_key_2024';

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: '用户名和密码不能为空' });
      return;
    }

    const existingUser = await getOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      res.status(400).json({ success: false, message: '用户名已存在' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await runQuery(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashedPassword, nickname || username]
    );

    await runQuery(
      'INSERT INTO contacts (user_id, name, role, is_default) VALUES (?, ?, ?, ?)',
      [result.lastID, '叨叨', 'assistant', 1]
    );

    await runQuery(
      'INSERT INTO accounts (user_id, name, is_default) VALUES (?, ?, ?)',
      [result.lastID, '默认账户', 1]
    );

    const token = jwt.sign({ id: result.lastID, username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: { id: result.lastID, username, nickname: nickname || username, is_vip: 0 }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: '用户名和密码不能为空' });
      return;
    }

    const user = await getOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
      return;
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          is_vip: user.is_vip,
          daily_stamina: user.daily_stamina
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getOne('SELECT id, username, nickname, avatar, is_vip, daily_stamina FROM users WHERE id = ?', [req.user!.id]);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;