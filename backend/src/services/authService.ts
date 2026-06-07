import bcrypt from 'bcryptjs';
import db from '../database';
import { signToken } from '../utils/jwt';

export interface LoginParams {
  phone: string;
  password: string;
}

export interface RegisterParams {
  phone: string;
  password: string;
  nickname?: string;
}

export interface UserInfo {
  id: number;
  phone: string;
  nickname: string;
  avatar: string | null;
  role: string;
  balance: number;
}

export function login(params: LoginParams): { token: string; user: UserInfo } | null {
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(params.phone) as any;
  if (!user) return null;

  const valid = bcrypt.compareSync(params.password, user.password_hash);
  if (!valid) return null;

  const token = signToken({ userId: user.id, phone: user.phone, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      balance: user.balance
    }
  };
}

export function loginByUsername(params: { username: string; password: string }): { token: string; user: UserInfo } | null {
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(params.username) as any;
  if (!user) return null;

  const valid = bcrypt.compareSync(params.password, user.password_hash);
  if (!valid) return null;

  const token = signToken({ userId: user.id, phone: user.phone, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      balance: user.balance
    }
  };
}

export function register(params: RegisterParams): { token: string; user: UserInfo } | null {
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(params.phone);
  if (existing) return null;

  const passwordHash = bcrypt.hashSync(params.password, 10);
  const result = db.prepare(`
    INSERT INTO users (phone, password_hash, nickname, role)
    VALUES (?, ?, ?, 'user')
  `).run(params.phone, passwordHash, params.nickname || params.phone);

  const userId = result.lastInsertRowid as number;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  const token = signToken({ userId: user.id, phone: user.phone, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      balance: user.balance
    }
  };
}

export function getUserById(userId: number): UserInfo | null {
  const user = db.prepare('SELECT id, phone, nickname, avatar, role, balance FROM users WHERE id = ?').get(userId) as any;
  return user || null;
}
