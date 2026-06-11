import db from '../database/index.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../middleware/auth.js';
import type { User, LoginResponse } from '../../shared/types.js';

export function login(username: string, password: string): LoginResponse {
  const row = db.prepare(`
    SELECT id, username, password_hash, name, role, school_id, phone, avatar, status, created_at, updated_at
    FROM users
    WHERE username = ? AND status = 'active'
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

  if (!row) {
    throw new Error('用户名或密码错误');
  }

  const isValid = bcrypt.compareSync(password, row.password_hash);
  if (!isValid) {
    throw new Error('用户名或密码错误');
  }

  const user: User = {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role as User['role'],
    schoolId: row.school_id,
    phone: row.phone,
    avatar: row.avatar,
    status: row.status as User['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role,
    schoolId: user.schoolId,
  });

  return { token, user };
}

export function getProfile(userId: number): User {
  const row = db.prepare(`
    SELECT id, username, name, role, school_id, phone, avatar, status, created_at, updated_at
    FROM users
    WHERE id = ?
  `).get(userId) as {
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

  if (!row) {
    throw new Error('用户不存在');
  }

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role as User['role'],
    schoolId: row.school_id,
    phone: row.phone,
    avatar: row.avatar,
    status: row.status as User['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function changePassword(userId: number, oldPassword: string, newPassword: string): void {
  const row = db.prepare(`
    SELECT password_hash
    FROM users
    WHERE id = ?
  `).get(userId) as { password_hash: string } | undefined;

  if (!row) {
    throw new Error('用户不存在');
  }

  const isValid = bcrypt.compareSync(oldPassword, row.password_hash);
  if (!isValid) {
    throw new Error('原密码错误');
  }

  const newHash = bcrypt.hashSync(newPassword, 10);

  db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newHash, userId);
}
