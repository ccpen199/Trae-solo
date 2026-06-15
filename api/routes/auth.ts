import { Router } from 'express';
import { findUserByUsername, createUser, verifyPassword, findUserById } from '../services/userService.ts';
import { generateToken, authMiddleware, type AuthRequest } from '../middleware/auth.ts';
import { success, error } from '../utils/response.ts';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return error(res, '用户名和密码不能为空', 400, 400);
  }

  const user = verifyPassword(username, password);
  if (!user) {
    return error(res, '用户名或密码错误', 401, 401);
  }

  const token = generateToken(user.id, user.role);
  return success(res, { token, user });
});

router.post('/register', (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password) {
    return error(res, '用户名和密码不能为空', 400, 400);
  }

  if (password.length < 6) {
    return error(res, '密码长度不能少于6位', 400, 400);
  }

  const existing = findUserByUsername(username);
  if (existing) {
    return error(res, '用户名已存在', 409, 409);
  }

  const userRole = role === 'creator' ? 'creator' : 'user';
  const user = createUser(username, password, userRole);
  const token = generateToken(user.id, user.role);
  
  return success(res, { token, user }, '注册成功');
});

router.get('/profile', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }

  const user = findUserById(req.userId);
  if (!user) {
    return error(res, '用户不存在', 404, 404);
  }

  return success(res, user);
});

router.post('/refresh', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId || !req.userRole) {
    return error(res, '用户未认证', 401, 401);
  }

  const token = generateToken(req.userId, req.userRole);
  const user = findUserById(req.userId);
  
  return success(res, { token, user });
});

export default router;
