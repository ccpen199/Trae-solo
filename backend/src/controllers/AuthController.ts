import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { success, error } from '../utils/response';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 1000);
    }
    const result = await authService.login(username, password);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  async register(req: Request, res: Response) {
    const { username, phone, password, name, role } = req.body;
    if (!username || !password || !name || !role) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = await authService.register({ username, phone: phone || null, password, name, role });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  async getMe(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = authService.getMe(userId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data);
  }
}
