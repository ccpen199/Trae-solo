import { Request, Response } from 'express';
import { success, error, serverError } from '../utils/response';
import { userService } from '../services';
import Joi from 'joi';

export const registerSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
    'string.pattern.base': '手机号格式不正确',
    'any.required': '手机号不能为空',
  }),
  code: Joi.string().optional(),
  password: Joi.string().min(6).max(20).required().messages({
    'string.min': '密码长度不能少于6位',
    'string.max': '密码长度不能超过20位',
    'any.required': '密码不能为空',
  }),
  nickname: Joi.string().max(20).optional(),
  inviteCode: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
    'string.pattern.base': '手机号格式不正确',
    'any.required': '手机号不能为空',
  }),
  password: Joi.string().required().messages({
    'any.required': '密码不能为空',
  }),
});

export const updateUserSchema = Joi.object({
  nickname: Joi.string().max(20).optional(),
  avatar: Joi.string().optional(),
  vin: Joi.string().optional(),
  plateNumber: Joi.string().optional(),
  realName: Joi.string().optional(),
  idCard: Joi.string().optional(),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await userService.register(req.body);
    success(res, result, '注册成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await userService.login(req.body);
    success(res, result, '登录成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const user = await userService.getUserById(userId);
    success(res, user);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const user = await userService.updateUser(userId, req.body);
    success(res, user, '更新成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const profile = await userService.getProfile(userId);
    success(res, profile);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  getUserProfile,
};
