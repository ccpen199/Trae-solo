import type { Request, Response } from 'express';
import { success, error } from '../utils/response.js';
import { authService } from '../services/authService.js';

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return error(res, '用户名和密码不能为空');
      }

      const result = await authService.login(username, password);
      if (!result) {
        return error(res, '用户名或密码错误');
      }

      return success(res, result, '登录成功');
    } catch (e: any) {
      return error(res, e.message || '登录失败');
    }
  },

  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return error(res, '请填写完整信息');
      }

      const user = await authService.register(username, email, password);
      return success(res, user, '注册成功');
    } catch (e: any) {
      return error(res, e.message || '注册失败');
    }
  },

  async applyReviewer(req: Request, res: Response) {
    try {
      const { userId, realName, qualifications, professionalFields } = req.body;
      if (!userId || !realName || !qualifications || !professionalFields) {
        return error(res, '请填写完整申请信息');
      }

      const reviewer = await authService.applyReviewer({
        userId,
        realName,
        qualifications,
        professionalFields,
      });
      return success(res, reviewer, '申请已提交，等待审核');
    } catch (e: any) {
      return error(res, e.message || '申请失败');
    }
  },

  async applyBrand(req: Request, res: Response) {
    try {
      const { name, category, businessLicense, contactName, contactPhone } = req.body;
      if (!name || !category || !businessLicense || !contactName || !contactPhone) {
        return error(res, '请填写完整入驻信息');
      }

      const brand = await authService.applyBrand({
        name,
        category,
        businessLicense,
        contactName,
        contactPhone,
      });
      return success(res, brand, '入驻申请已提交，等待审核');
    } catch (e: any) {
      return error(res, e.message || '申请失败');
    }
  },

  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = parseInt((req as any).userId);
      if (!userId) return error(res, '未登录', 1, 401);

      const user = await authService.getUserById(userId);
      if (!user) return error(res, '用户不存在', 1, 404);

      return success(res, user);
    } catch (e: any) {
      return error(res, e.message || '获取用户信息失败');
    }
  },
};
