import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { successResponse, errorResponse, generateToken, getTokenExpiry } from '../utils/common.js';

const router = Router();

router.post('/register', (req, res) => {
  const { username, password, phone, real_name, id_card } = req.body;

  if (!username || !password || !phone) {
    return errorResponse(res, '用户名、密码和手机号不能为空');
  }

  const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ?').get(username, phone);
  if (existingUser) {
    return errorResponse(res, '用户名或手机号已存在');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password, phone, real_name, id_card) VALUES (?, ?, ?, ?, ?)'
  ).run(username, hashedPassword, phone, real_name || null, id_card || null);

  const user = db.prepare('SELECT id, username, phone, real_name, role, avatar, address, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

  return successResponse(res, user, '注册成功');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return errorResponse(res, '用户名和密码不能为空');
  }

  const user: any = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ?').get(username, username);
  
  if (!user) {
    return errorResponse(res, '用户不存在');
  }

  if (user.status !== 1) {
    return errorResponse(res, '账号已被禁用');
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return errorResponse(res, '密码错误');
  }

  const token = generateToken({ id: user.id, username: user.username, role: user.role });
  const expiresAt = getTokenExpiry();

  db.prepare('INSERT INTO access_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    user.id,
    token,
    expiresAt.toISOString()
  );

  const userInfo = {
    id: user.id,
    username: user.username,
    real_name: user.real_name,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    token,
    token_type: 'Bearer',
    expires_at: expiresAt.toISOString()
  };

  return successResponse(res, userInfo, '登录成功');
});

router.post('/logout', authMiddleware, (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    db.prepare('DELETE FROM access_tokens WHERE token = ?').run(token);
  }

  return successResponse(res, null, '登出成功');
});

router.get('/profile', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  
  const user = db.prepare(
    'SELECT id, username, real_name, phone, id_card, role, avatar, address, created_at, updated_at FROM users WHERE id = ?'
  ).get(userId);

  if (!user) {
    return errorResponse(res, '用户不存在', 404);
  }

  return successResponse(res, user);
});

router.put('/profile', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { real_name, avatar, address } = req.body;

  db.prepare(
    'UPDATE users SET real_name = ?, avatar = ?, address = ?, updated_at = datetime(\"now\") WHERE id = ?'
  ).run(real_name || null, avatar || null, address || null, userId);

  const user = db.prepare(
    'SELECT id, username, real_name, phone, id_card, role, avatar, address, created_at, updated_at FROM users WHERE id = ?'
  ).get(userId);

  return successResponse(res, user, '更新成功');
});

router.put('/password', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { old_password, new_password } = req.body;

  if (!old_password || !new_password) {
    return errorResponse(res, '旧密码和新密码不能为空');
  }

  const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!bcrypt.compareSync(old_password, user.password)) {
    return errorResponse(res, '旧密码错误');
  }

  const hashedPassword = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = datetime(\"now\") WHERE id = ?').run(hashedPassword, userId);

  return successResponse(res, null, '密码修改成功');
});

export default router;
