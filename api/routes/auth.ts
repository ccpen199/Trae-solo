import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/index.js';
import { authMiddleware, AuthRequest, signToken } from '../middleware/auth.js';
import { operationLog } from '../middleware/logger.js';
import { success, error } from '../utils/response.js';
import type { LoginRequest, LoginResponse, User } from '../../shared/types.js';

const router = Router();

router.post('/login', operationLog('auth', '登录'), (req: AuthRequest, res: Response): void => {
  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    res.status(400).json(error('用户名和密码不能为空'));
    return;
  }

  const user = db.prepare(`
    SELECT id, username, password_hash, name, role, school_id, phone, avatar, status, created_at, updated_at
    FROM users
    WHERE username = ?
  `).get(username) as {
    id: number;
    username: string;
    password_hash: string;
    name: string;
    role: string;
    school_id?: number;
    phone?: string;
    avatar?: string;
    status: string;
    created_at: string;
    updated_at: string;
  } | undefined;

  if (!user) {
    res.status(401).json(error('用户名或密码错误'));
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json(error('账户已被禁用'));
    return;
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    res.status(401).json(error('用户名或密码错误'));
    return;
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role,
    schoolId: user.school_id,
  });

  const userInfo: User = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role as 'school_admin' | 'city_admin',
    schoolId: user.school_id,
    phone: user.phone,
    avatar: user.avatar,
    status: user.status as 'active' | 'disabled',
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };

  res.json(success<LoginResponse>({ token, user: userInfo }, '登录成功'));
});

router.get('/profile', authMiddleware, operationLog('auth', '获取用户信息'), (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json(error('未登录'));
    return;
  }

  const user = db.prepare(`
    SELECT id, username, name, role, school_id, phone, avatar, status, created_at, updated_at
    FROM users
    WHERE id = ?
  `).get(req.user.id) as {
    id: number;
    username: string;
    name: string;
    role: string;
    school_id?: number;
    phone?: string;
    avatar?: string;
    status: string;
    created_at: string;
    updated_at: string;
  } | undefined;

  if (!user) {
    res.status(404).json(error('用户不存在'));
    return;
  }

  const userInfo: User = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role as 'school_admin' | 'city_admin',
    schoolId: user.school_id,
    phone: user.phone,
    avatar: user.avatar,
    status: user.status as 'active' | 'disabled',
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };

  res.json(success<User>(userInfo));
});

router.put('/password', authMiddleware, operationLog('auth', '修改密码'), (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json(error('未登录'));
    return;
  }

  const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };

  if (!oldPassword || !newPassword) {
    res.status(400).json(error('原密码和新密码不能为空'));
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json(error('新密码长度不能少于6位'));
    return;
  }

  const user = db.prepare(`
    SELECT password_hash
    FROM users
    WHERE id = ?
  `).get(req.user.id) as { password_hash: string } | undefined;

  if (!user) {
    res.status(404).json(error('用户不存在'));
    return;
  }

  const isValid = bcrypt.compareSync(oldPassword, user.password_hash);
  if (!isValid) {
    res.status(400).json(error('原密码错误'));
    return;
  }

  const newPasswordHash = bcrypt.hashSync(newPassword, 10);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = ?
    WHERE id = ?
  `).run(newPasswordHash, now, req.user.id);

  res.json(success(null, '密码修改成功'));
});

export default router;
