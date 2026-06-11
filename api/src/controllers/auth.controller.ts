import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../database/connection.js';
import type { LoginRequest, User, UserRole } from '../../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smart_community_2024_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const rolePermissions: Record<UserRole, string[]> = {
  owner: ['access:manage', 'workorder:create', 'workorder:view', 'mall:view', 'mall:order', 'social:view', 'social:post', 'profile:view'],
  tenant: ['access:use', 'workorder:create', 'workorder:view', 'mall:view', 'mall:order', 'social:view', 'social:post', 'profile:view'],
  visitor: ['access:use', 'mall:view'],
  property: ['access:manage', 'workorder:manage', 'workorder:view', 'risk:view', 'risk:manage', 'analytics:view', 'property:dashboard'],
  merchant: ['mall:manage', 'product:manage', 'coupon:manage', 'order:view', 'merchant:dashboard', 'analytics:view']
};

export async function login(req: Request, res: Response) {
  try {
    const { username, password, role }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: '请填写完整的登录信息' });
    }

    let user;
    if (role) {
      user = db.prepare('SELECT * FROM users WHERE role = ? AND username = ?').get(role, username) as (User & { password_hash: string }) | undefined;
    } else {
      user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as (User & { password_hash: string }) | undefined;
    }

    if (!user) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const { password_hash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        token,
        user: {
          ...userWithoutPassword,
          permissions: rolePermissions[user.role] || []
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: '登录失败' });
  }
}

export async function getCurrentUser(req: Request & { user?: any }, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未登录' });
    }

    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, error: '获取用户信息失败' });
  }
}

export default { login, getCurrentUser };
