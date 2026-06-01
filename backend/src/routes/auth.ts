import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'k8s-gov-platform-secret-key-for-dev-2026';

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ code: 400, message: '用户名和密码不能为空', data: null });
    return;
  }

  const user = UserModel.findByUsername(username);
  if (!user) {
    res.status(401).json({ code: 401, message: '用户名或密码错误', data: null });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ code: 401, message: '用户名或密码错误', data: null });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: { id: user.id, username: user.username, role: user.role }
    }
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ code: 401, message: '未认证', data: null });
    return;
  }

  const user = UserModel.findById(req.user.userId);
  if (!user) {
    res.status(404).json({ code: 404, message: '用户不存在', data: null });
    return;
  }

  res.json({ code: 200, message: 'success', data: user });
});

export default router;
