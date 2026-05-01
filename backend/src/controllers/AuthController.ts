import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/AuthService';

export const AuthController = {
  register: [
    body('username')
      .isLength({ min: 3, max: 20 })
      .withMessage('用户名长度应在 3-20 个字符之间')
      .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
      .withMessage('用户名只能包含字母、数字、下划线和中文'),
    body('email')
      .isEmail()
      .withMessage('请输入有效的邮箱地址'),
    body('password')
      .isLength({ min: 6, max: 128 })
      .withMessage('密码长度应在 6-128 个字符之间'),
    
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        const { username, email, password } = req.body;
        const result = await authService.register({
          username,
          email,
          password,
          ipAddress: req.ip
        });

        return res.status(201).json({
          success: true,
          data: {
            user: {
              id: result.user.id,
              username: result.user.username,
              email: result.user.email,
              role: result.user.role,
              avatarUrl: result.user.avatarUrl
            },
            token: result.token
          }
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  ],

  login: [
    body('username')
      .notEmpty()
      .withMessage('请输入用户名或邮箱'),
    body('password')
      .notEmpty()
      .withMessage('请输入密码'),
    
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        const { username, password } = req.body;
        const result = await authService.login({
          usernameOrEmail: username,
          password,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });

        return res.json({
          success: true,
          data: {
            user: {
              id: result.user.id,
              username: result.user.username,
              email: result.user.email,
              role: result.user.role,
              avatarUrl: result.user.avatarUrl,
              level: result.user.level,
              reputation: result.user.reputation
            },
            token: result.token
          }
        });
      } catch (error: any) {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }
    }
  ],

  logout: async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await authService.logout(token);
      }

      return res.json({
        success: true,
        message: '已成功登出'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  getCurrentUser: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '未登录'
        });
      }

      const user = await authService.getCurrentUser(req.user.id);
      
      return res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};
