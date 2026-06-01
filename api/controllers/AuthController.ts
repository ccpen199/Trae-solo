import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import type { LoginRequest, ApiResponse } from '../../shared/types.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body as LoginRequest;
      
      if (!username || !password) {
        return res.status(400).json({
          code: 400,
          message: '用户名和密码不能为空',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const result = await this.authService.login(username, password);
      
      if (!result) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: '登录成功',
        data: result,
        timestamp: Date.now()
      } as ApiResponse<typeof result>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '登录失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }
}
