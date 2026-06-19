import { getDB } from '../models/database';
import { generateToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';

export function adminLogin(username: string, password: string) {
  const db = getDB();
  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;

  if (!admin) {
    throw new Error('用户名或密码错误');
  }

  if (!bcrypt.compareSync(password, admin.password)) {
    throw new Error('用户名或密码错误');
  }

  const token = generateToken({ adminId: admin.id, username: admin.username, role: admin.role });

  return {
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    },
  };
}

export function getAdminProfile(adminId: number) {
  const db = getDB();
  const admin = db.prepare('SELECT id, username, role, created_at FROM admin_users WHERE id = ?').get(adminId);
  return admin;
}

export function blockUser(userId: number, blocked: boolean = true) {
  const db = getDB();
  db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(blocked ? 1 : 0, userId);
  return db.prepare('SELECT id, nickname, is_blocked FROM users WHERE id = ?').get(userId);
}

export function markCheater(userId: number, isCheater: boolean = true) {
  const db = getDB();
  db.prepare('UPDATE users SET is_cheater = ? WHERE id = ?').run(isCheater ? 1 : 0, userId);
  return db.prepare('SELECT id, nickname, is_cheater, risk_score FROM users WHERE id = ?').get(userId);
}
