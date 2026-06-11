import db from '../db/database.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.middleware.js';
import { User, LoginRequest, LoginResponse, RegisterRequest, ApiResponse } from '../../shared/types.js';

function parseUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    email: row.email as string,
    phone: (row.phone as string) || '',
    name: row.name as string,
    avatar: (row.avatar as string) || null,
    role: row.role as User['role'],
    status: row.status as User['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class AuthService {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const userRow = db.prepare(`
      SELECT * FROM users WHERE email = ? AND role = ?
    `).get(data.email, data.role) as Record<string, unknown> | undefined;

    if (!userRow) {
      return {
        success: false,
        message: '用户不存在或角色不匹配',
      };
    }

    const isValid = bcrypt.compareSync(data.password, userRow.password_hash as string);
    if (!isValid) {
      return {
        success: false,
        message: '密码错误',
      };
    }

    if (userRow.status === 'suspended') {
      return {
        success: false,
        message: '账号已被封禁',
      };
    }

    const user = parseUser(userRow);
    const token = generateToken(user);

    return {
      success: true,
      message: '登录成功',
      data: { token, user },
    };
  }

  async register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const existing = db.prepare(`
      SELECT id FROM users WHERE email = ?
    `).get(data.email) as Record<string, unknown> | undefined;

    if (existing) {
      return {
        success: false,
        message: '该邮箱已被注册',
      };
    }

    const passwordHash = bcrypt.hashSync(data.password, 10);

    const result = db.prepare(`
      INSERT INTO users (email, phone, password_hash, name, role, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).run(data.email, data.phone, passwordHash, data.name, data.role);

    if (data.role === 'provider') {
      db.prepare(`
        INSERT INTO talents (user_id, real_name, skills, bio, rating, level, verified)
        VALUES (?, ?, '[]', '', 0, 'entry', 0)
      `).run(result.lastInsertRowid, data.name);
    }

    db.prepare(`
      INSERT INTO wallets (user_id, balance, frozen_balance)
      VALUES (?, 0, 0)
    `).run(result.lastInsertRowid);

    const userRow = db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).get(result.lastInsertRowid) as Record<string, unknown>;

    const user = parseUser(userRow);
    const token = generateToken(user);

    return {
      success: true,
      message: '注册成功',
      data: { token, user },
    };
  }

  async getCurrentUser(userId: number): Promise<ApiResponse<User>> {
    const userRow = db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).get(userId) as Record<string, unknown> | undefined;

    if (!userRow) {
      return {
        success: false,
        message: '用户不存在',
      };
    }

    return {
      success: true,
      data: parseUser(userRow),
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    return {
      success: true,
      message: '登出成功',
    };
  }
}

export default new AuthService();
