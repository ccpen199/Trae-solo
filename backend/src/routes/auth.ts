import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { authenticate, AuthRequest, logOperation } from '../middleware/auth';
import { success, error } from '../utils';

const router = Router();

router.post('/login', logOperation('auth', 'login'), (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return error(res, '用户名和密码不能为空');
  }

  const user = db.prepare(`
    SELECT u.*, r.name as role_name, r.permissions, s.name as store_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN stores s ON u.store_id = s.id
    WHERE u.username = ?
  `).get(username);

  if (!user || user.status !== 'active') {
    return error(res, '用户不存在或已禁用');
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return error(res, '密码错误');
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET || 'pos-secret',
    { expiresIn: '24h' }
  );

  db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  success(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role: user.role_name,
      role_id: user.role_id,
      store_id: user.store_id,
      store_name: user.store_name,
      permissions: JSON.parse(user.permissions || '[]')
    }
  }, '登录成功');
});

router.post('/logout', authenticate, logOperation('auth', 'logout'), (req: AuthRequest, res) => {
  success(res, null, '登出成功');
});

router.get('/profile', authenticate, (req: AuthRequest, res) => {
  const user = db.prepare(`
    SELECT u.id, u.username, u.real_name, u.phone, u.email, u.role_id, u.store_id,
           r.name as role_name, s.name as store_name, r.permissions
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN stores s ON u.store_id = s.id
    WHERE u.id = ?
  `).get(req.user!.id);

  if (user) {
    user.permissions = JSON.parse(user.permissions || '[]');
  }

  success(res, user);
});

router.post('/change-password', authenticate, logOperation('auth', 'change_password'), (req: AuthRequest, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) {
    return error(res, '原密码和新密码不能为空');
  }
  if (new_password.length < 6) {
    return error(res, '新密码长度不能少于6位');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id);
  if (!user) {
    return error(res, '用户不存在');
  }

  const isValid = bcrypt.compareSync(old_password, user.password);
  if (!isValid) {
    return error(res, '原密码错误');
  }

  const salt = bcrypt.genSaltSync(10);
  const hashPwd = bcrypt.hashSync(new_password, salt);
  db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashPwd, req.user!.id);

  success(res, null, '密码修改成功');
});

export default router;
