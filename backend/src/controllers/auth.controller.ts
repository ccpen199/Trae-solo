
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import db from '../database';
import logger from '../utils/logger';

const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
    'string.pattern.base': '手机号格式不正确'
  }),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('parent', 'grandparent').default('parent')
});

const registerSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  password: Joi.string().min(6).required(),
  nickname: Joi.string().max(50),
  role: Joi.string().valid('parent', 'grandparent').default('parent')
});

export async function login(req: Request, res: Response) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const { phone, password } = value;
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ success: false, message: '手机号或密码错误' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret' as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const { phone, password, nickname, role } = value;

    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      res.status(400).json({ success: false, message: '该手机号已注册' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (phone, password_hash, nickname, role)
      VALUES (?, ?, ?, ?)
    `).run(phone, passwordHash, nickname || `用户${phone.slice(-4)}`, role);

    const token = jwt.sign(
      { userId: result.lastInsertRowid, role },
      process.env.JWT_SECRET || 'secret' as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: result.lastInsertRowid,
          phone,
          nickname: nickname || `用户${phone.slice(-4)}`,
          role
        }
      }
    });
  } catch (error) {
    logger.error('注册错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT id, phone, nickname, avatar, role, storage_used, storage_limit FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('获取当前用户错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}
