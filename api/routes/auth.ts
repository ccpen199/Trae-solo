import { Router } from 'express';
import { login } from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import { LoginRequest } from '../../shared/types.js';

const router = Router();

router.post('/login', (req, res): void => {
  const { account, password, role } = req.body as LoginRequest;

  if (!account || !password || !role) {
    res.status(400).json({ code: 400, message: '缺少必要参数', data: null });
    return;
  }

  const result = login({ account, password, role });
  if (!result) {
    res.status(401).json({ code: 401, message: '账号或密码错误', data: null });
    return;
  }

  res.json({ code: 200, message: '登录成功', data: result });
});

router.get('/me', authMiddleware(), (req, res): void => {
  res.json({ code: 200, message: 'success', data: req.auth });
});

export default router;
