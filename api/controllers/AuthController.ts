import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          code: 400,
          success: false,
          message: '用户名和密码不能为空',
          error: '请输入完整的用户名和密码',
        });
        return;
      }

      const user = this.authService['userRepository'].findByUsername(username);
      
      if (!user) {
        res.status(401).json({
          code: 401,
          success: false,
          message: '账号不存在',
          error: `未找到用户 "${username}"，请检查账号是否正确`,
        });
        return;
      }

      if (user.status !== 'active') {
        res.status(403).json({
          code: 403,
          success: false,
          message: '账号已被禁用',
          error: '该账号已被禁用，请联系管理员处理',
        });
        return;
      }

      if (!this.authService['comparePassword'](password, user.password)) {
        res.status(401).json({
          code: 401,
          success: false,
          message: '密码错误',
          error: '密码输入错误，请重试（默认密码：123456）',
        });
        return;
      }

      const result = await this.authService.login({ username, password });

      if (!result) {
        res.status(401).json({
          code: 401,
          success: false,
          message: '登录失败',
          error: '用户名或密码错误，请重试',
        });
        return;
      }

      const roleNames: Record<string, string> = {
        admin: '系统管理员',
        property: '物业管理员',
        resident: '小区居民',
        merchant: '入驻商家',
      };

      res.json({
        code: 200,
        success: true,
        message: `登录成功，欢迎回来，${roleNames[result.user.role] || result.user.role}！`,
        data: {
          token: result.access_token,
          access_token: result.access_token,
          token_type: result.token_type,
          expires_in: result.expires_in,
          user: result.user,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        code: 500,
        success: false,
        message: '系统异常',
        error: '服务器内部错误，请稍后重试或联系技术支持',
      });
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, name, phone, role } = req.body;

      if (!username || !password || !name || !phone || !role) {
        res.status(400).json({
          success: false,
          error: '请填写完整信息',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: '密码长度不能少于6位',
        });
        return;
      }

      const result = await this.authService.register({ username, password, name, phone, role });

      if (!result) {
        res.status(400).json({
          success: false,
          error: '用户名已存在',
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '注册失败',
      });
    }
  }

  public async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未登录',
        });
        return;
      }

      const user = this.authService.getCurrentUser(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: '用户不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取用户信息失败',
      });
    }
  }

  public async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未登录',
        });
        return;
      }

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: '请输入旧密码和新密码',
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          error: '新密码长度不能少于6位',
        });
        return;
      }

      const success = await this.authService.changePassword(req.user.id, oldPassword, newPassword);

      if (!success) {
        res.status(400).json({
          success: false,
          error: '旧密码错误',
        });
        return;
      }

      res.json({
        success: true,
        message: '密码修改成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '修改密码失败',
      });
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: '退出登录成功',
    });
  }
}

export default AuthController;
