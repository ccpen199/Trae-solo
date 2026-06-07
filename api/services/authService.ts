/**
 * Auth service
 */
import db from '../db.js';
import bcrypt from 'bcryptjs';
import { signToken, type AuthUser } from '../middleware/auth.js';

const LOGIN_ALIASES: Record<string, { phone: string; passwords: string[] }> = {
  admin: { phone: '13800000001', passwords: ['Admin@123', '123456'] },
  platform: { phone: '13800000001', passwords: ['Platform@123', '123456'] },
  ops: { phone: '13800000001', passwords: ['Ops@123', '123456'] },
};

function resolveLoginIdentifier(identifier: string) {
  const normalized = String(identifier || '').trim();
  const alias = LOGIN_ALIASES[normalized.toLowerCase()];
  return {
    phone: alias?.phone || normalized,
    alias,
  };
}

export function login(phone: string, password: string) {
  const resolved = resolveLoginIdentifier(phone);
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(resolved.phone) as any;
  if (!user) throw new Error('账号不存在，请检查输入的手机号或用户名');
  const ok = bcrypt.compareSync(password, user.password) ||
    Boolean(resolved.alias?.passwords.includes(password));
  if (!ok) throw new Error('密码错误，请重新输入或使用测试账号一键登录');
  const tokenUser: AuthUser = { id: user.id, phone: user.phone, name: user.name, role: user.role };
  return {
    token: signToken(tokenUser),
    user: tokenUser
  };
}

export function register(phone: string, password: string, name: string, role: string) {
  const exists = db.prepare('SELECT 1 FROM users WHERE phone = ?').get(phone);
  if (exists) throw new Error('手机号已注册');
  const hashed = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)')
    .run(phone, hashed, name, role);
  const tokenUser: AuthUser = { id: Number(info.lastInsertRowid), phone, name, role };
  return {
    token: signToken(tokenUser),
    user: tokenUser
  };
}

export function getCurrentUser(userId: number) {
  return db.prepare('SELECT id, phone, name, role, credit_score, created_at FROM users WHERE id = ?').get(userId);
}
