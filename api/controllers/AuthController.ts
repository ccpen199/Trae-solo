import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { AuthRequest } from '../middleware/auth.js';
import { LoginRequest } from '../types/index.js';

const authService = new AuthService();

export class AuthController {
  static async login(req: Request, res: Response) {
    const { idCard, password, userType } = req.body as LoginRequest;
    
    if (!idCard || !password) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const result = await authService.login({ idCard, password, userType: userType || 'natural' });
    
    if (!result) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    res.json({ success: true, data: result });
  }

  static getMe(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    res.json(req.user);
  }

  static logout(req: AuthRequest, res: Response) {
    res.json({ message: '退出登录成功' });
  }
}
