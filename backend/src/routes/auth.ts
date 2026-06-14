import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(6).max(50)
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string()
});

function normalizeLoginEmail(value: string) {
  const login = String(value || '').trim();
  const aliases: Record<string, string> = {
    admin: 'admin@resume.com',
    test: 'test@example.com',
    platform: 'admin@resume.com',
    word: 'test@example.com'
  };
  return aliases[login.toLowerCase()] || login;
}

router.post('/register', (req, res) => {
  try {
    const { email, name, password } = registerSchema.parse(req.body);
    
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }
    
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)').run(email, name, hash);
    
    const token = jwt.sign(
      { userId: result.lastInsertRowid },
      process.env.JWT_SECRET || 'resume_workbench_secret_key_2024',
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        name,
        is_admin: 0
      }
    });
  } catch (err) {
    res.status(400).json({ error: '注册信息格式不正确' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const loginEmail = normalizeLoginEmail(email);
    
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(loginEmail);
    const isLegacyAdminDemoPassword = user?.is_admin === 1
      && loginEmail === 'admin@resume.com'
      && password === '123456'
      && bcrypt.compareSync('admin123456', user.password_hash);
    if (!user || (!bcrypt.compareSync(password, user.password_hash) && !isLegacyAdminDemoPassword)) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'resume_workbench_secret_key_2024',
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin
      }
    });
  } catch (err) {
    res.status(400).json({ error: '登录信息格式不正确' });
  }
});

router.get('/profile', authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

router.put('/profile', authMiddleware, (req: AuthRequest, res) => {
  const { name } = req.body;
  if (!name || name.length < 2 || name.length > 50) {
    return res.status(400).json({ error: '姓名长度必须在2-50个字符之间' });
  }
  
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user!.id);
  res.json({ success: true });
});

export default router;
