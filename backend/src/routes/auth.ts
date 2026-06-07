import { Router, Response } from 'express';
import { login, register, getUserById, loginByUsername } from '../services/authService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();

router.post('/login', (req, res: Response) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    error(res, '账号和密码不能为空');
    return;
  }

  let result = login({ phone, password });
  
  if (!result) {
    result = loginByUsername({ username: phone, password });
  }
  
  if (!result) {
    error(res, '账号或密码错误');
    return;
  }

  success(res, result, '登录成功');
});

router.post('/register', (req, res: Response) => {
  const { phone, password, nickname } = req.body;
  if (!phone || !password) {
    error(res, '手机号和密码不能为空');
    return;
  }
  if (password.length < 6) {
    error(res, '密码长度不能少于6位');
    return;
  }

  const result = register({ phone, password, nickname });
  if (!result) {
    error(res, '该手机号已注册');
    return;
  }

  success(res, result, '注册成功');
});

router.get('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const user = getUserById(userId);
  if (!user) {
    error(res, '用户不存在', 404);
    return;
  }
  success(res, user);
});

router.get('/userinfo', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const user = getUserById(userId);
  if (!user) {
    error(res, '用户不存在', 404);
    return;
  }
  success(res, user);
});

export default router;
