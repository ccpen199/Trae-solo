import { Request, Response } from 'express';
import { authService } from '../services/authService';
import type { ApiResponse } from '../../shared/types';

export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({
        code: 400,
        message: '手机号和密码不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }

    const result = await authService.login({ phone, password });
    if (!result) {
      return res.status(401).json({
        code: 401,
        message: '手机号或密码错误',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }

    res.json({
      code: 200,
      message: '登录成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const faceVerify = async (req: Request, res: Response) => {
  try {
    const { faceImage } = req.body;
    if (!faceImage) {
      return res.status(400).json({
        code: 400,
        message: '人脸图像不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }

    const result = await authService.faceVerify(faceImage);
    res.json({
      code: 200,
      message: result.verified ? '认证成功' : '认证失败',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = authService.getCurrentUser();
    res.json({
      code: 200,
      message: '获取成功',
      data: user,
      timestamp: Date.now(),
    } as ApiResponse<typeof user>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};
