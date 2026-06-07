import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { JWT_SECRET } from '../middleware/auth.js';
import type { ApiResponse, User, LoginRequest, RegisterRequest, LoginResponse, JwtPayload } from '../types/index.js';

const SALT_ROUNDS = 10;

const parseUserRow = (row: any): Omit<User, 'password_hash'> => {
  const { password_hash, tags, ...rest } = row;
  return {
    ...rest,
    tags: tags ? JSON.parse(tags) : []
  };
};

export const login = (req: Request, res: Response): void => {
  try {
    const { phone, password } = req.body as LoginRequest;

    if (!phone || !password) {
      res.status(400).json({
        code: 400,
        message: '手机号和密码不能为空',
        data: null
      } as ApiResponse);
      return;
    }

    const userRow = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;

    if (!userRow) {
      res.status(401).json({
        code: 401,
        message: '用户不存在',
        data: null
      } as ApiResponse);
      return;
    }

    const isValid = bcrypt.compareSync(password, userRow.password_hash);
    if (!isValid) {
      res.status(401).json({
        code: 401,
        message: '密码错误',
        data: null
      } as ApiResponse);
      return;
    }

    const user = parseUserRow(userRow);
    const payload: JwtPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      code: 200,
      message: '登录成功',
      data: { token, user } as LoginResponse
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '登录失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const register = (req: Request, res: Response): void => {
  try {
    const { phone, password, name, role = 'customer', city = '' } = req.body as RegisterRequest;

    if (!phone || !password || !name) {
      res.status(400).json({
        code: 400,
        message: '手机号、密码和姓名不能为空',
        data: null
      } as ApiResponse);
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        code: 400,
        message: '密码长度不能少于6位',
        data: null
      } as ApiResponse);
      return;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      res.status(400).json({
        code: 400,
        message: '该手机号已被注册',
        data: null
      } as ApiResponse);
      return;
    }

    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const tags = JSON.stringify([]);

    const result = db.prepare(`
      INSERT INTO users (phone, name, password_hash, role, city, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(phone, name, passwordHash, role, city, tags);

    const userId = result.lastInsertRowid as number;
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    const user = parseUserRow(userRow);

    const payload: JwtPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      code: 200,
      message: '注册成功',
      data: { token, user } as LoginResponse
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '注册失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getProfile = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        code: 401,
        message: '请先登录',
        data: null
      } as ApiResponse);
      return;
    }

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    if (!userRow) {
      res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      } as ApiResponse);
      return;
    }

    const user = parseUserRow(userRow);

    res.json({
      code: 200,
      message: '获取成功',
      data: user
    } as ApiResponse<Omit<User, 'password_hash'>>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const logout = (req: Request, res: Response): void => {
  res.json({
    code: 200,
    message: '退出登录成功',
    data: null
  } as ApiResponse);
};

export default { login, register, getProfile, logout };
