import type { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { success, error } from '../utils/response';
import type { AuthRequest } from '../middleware/auth';
import type { LoginRequest, RegisterRequest } from '@shared/types';

export class AuthController {
  private authService = new AuthService();

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body as LoginRequest;

      if ((!username && !email) || !password) {
        res.status(400).json(error('账号和密码不能为空', 400));
        return;
      }

      const loginData: LoginRequest = { password };
      if (email) {
        loginData.email = email;
      } else if (username) {
        loginData.username = username;
      }

      const result = await this.authService.login(loginData);
      res.json(success(result, '登录成功'));
    } catch (err) {
      res.status(401).json(error(err instanceof Error ? err.message : '登录失败', 401));
    }
  }

  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body as RegisterRequest;

      if (!username || !email || !password) {
        res.status(400).json(error('用户名、邮箱和密码不能为空'));
        return;
      }

      if (password.length < 6) {
        res.status(400).json(error('密码长度至少6位'));
        return;
      }

      const user = await this.authService.register({ username, email, password });
      res.status(201).json(success(user, '注册成功'));
    } catch (err) {
      res.status(400).json(error(err instanceof Error ? err.message : '注册失败'));
    }
  }

  getCurrentUser(req: AuthRequest, res: Response): void {
    try {
      if (!req.userId) {
        res.status(401).json(error('未登录'));
        return;
      }

      const user = this.authService.getCurrentUser(req.userId);
      
      if (!user) {
        res.status(404).json(error('用户不存在'));
        return;
      }

      res.json(success(user));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取用户信息失败'));
    }
  }

  getAllUsers(req: AuthRequest, res: Response): void {
    try {
      const users = this.authService.getAllUsers();
      res.json(success(users));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取用户列表失败'));
    }
  }
}
