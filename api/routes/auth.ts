import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { findByUsername, findById } from '../repositories/userRepository.js';
import { generateToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/auth.js';
import type { LoginRequest, ApiResponse, LoginResponse, User } from '../types/index.js';

const router = Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body as LoginRequest;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' } as ApiResponse);
    }
    
    const user = findByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' } as ApiResponse);
    }
    
    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' } as ApiResponse);
    }
    
    const token = generateToken(user);
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
    
    res.json({ 
      success: true, 
      data: { user: userWithoutPassword as User, token } 
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' } as ApiResponse);
  }
});

router.get('/me', authMiddleware, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未登录' } as ApiResponse);
    }
    
    const user = findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: '用户不存在' } as ApiResponse);
    }
    
    res.json({ success: true, data: user } as ApiResponse<User>);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' } as ApiResponse);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: '已退出登录' } as ApiResponse);
});

export default router;
