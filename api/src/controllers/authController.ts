import { Request, Response } from 'express';
import db from '@/db/index.js';
import { generateToken } from '@/middleware/auth.js';
import type { LoginRequest, RegisterRequest, LoginResponse, User } from '@shared/types';

export const login = (req: Request, res: Response) => {
  try {
    const { idCard, password } = req.body as LoginRequest;

    if (!idCard || !password) {
      res.status(400).json({ success: false, message: '身份证号和密码不能为空' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE id_card = ?').get(idCard) as any;

    if (!user) {
      res.status(401).json({ success: false, message: '用户不存在' });
      return;
    }

    if (user.password !== password) {
      res.status(401).json({ success: false, message: '密码错误' });
      return;
    }

    const token = generateToken({ userId: user.id, role: user.role });

    const userData: User = {
      id: user.id,
      idCard: user.id_card,
      name: user.name,
      phone: user.phone,
      role: user.role,
      memberStatus: user.member_status,
      createdAt: user.created_at,
    };

    const data: LoginResponse = { token, user: userData };

    res.status(200).json({ success: true, data, message: '登录成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '登录失败，服务器错误' });
  }
};

export const register = (req: Request, res: Response) => {
  try {
    const { idCard, name, phone, password } = req.body as RegisterRequest;

    if (!idCard || !name || !phone || !password) {
      res.status(400).json({ success: false, message: '请填写完整的注册信息' });
      return;
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE id_card = ?').get(idCard);

    if (existingUser) {
      res.status(409).json({ success: false, message: '该身份证号已注册' });
      return;
    }

    const result = db
      .prepare('INSERT INTO users (id_card, name, phone, password, role, member_status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(idCard, name, phone, password, 'worker', 'pending');

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;

    const token = generateToken({ userId: user.id, role: user.role });

    const userData: User = {
      id: user.id,
      idCard: user.id_card,
      name: user.name,
      phone: user.phone,
      role: user.role,
      memberStatus: user.member_status,
      createdAt: user.created_at,
    };

    const data: LoginResponse = { token, user: userData };

    res.status(201).json({ success: true, data, message: '注册成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '注册失败，服务器错误' });
  }
};
