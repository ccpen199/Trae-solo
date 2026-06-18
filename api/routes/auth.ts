import { Router } from 'express';
import { z } from 'zod';
import { db, queryOne } from '../db.js';
import { success, error } from '../utils/response.js';
import { generateToken, comparePassword } from '../utils/jwt.js';
import type { User, LoginRequest, LoginResponse } from '../../shared/types.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

router.post('/login', (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    
    const user = queryOne<User & { password_hash: string }>(
      'SELECT * FROM users WHERE username = ?',
      [validated.username]
    );

    if (!user) {
      res.status(401).json(error('用户名或密码错误', 401));
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json(error('账户已被禁用，请联系管理员', 403));
      return;
    }

    if (!comparePassword(validated.password, user.password_hash)) {
      res.status(401).json(error('用户名或密码错误', 401));
      return;
    }

    const token = generateToken(user);
    const { password_hash, ...userWithoutPassword } = user;

    res.json(success<LoginResponse>({
      token,
      user: userWithoutPassword as User,
    }, '登录成功'));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json(error(err.errors[0].message, 400));
      return;
    }
    res.status(500).json(error('登录失败', 500));
  }
});

router.post('/refresh', (req, res) => {
  res.json(success({ refreshed: true }, 'Token 刷新成功'));
});

export default router;
