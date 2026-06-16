import { Request, Response } from 'express';
import { authService } from '../services/authService';
import type { ApiResponse } from '../../shared/types';

const buildErrorResponse = (status: number, error: string, message: string) => ({
  code: status,
  message,
  data: { error },
  timestamp: Date.now(),
});

export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json(buildErrorResponse(400, 'BAD_REQUEST', '手机号和密码不能为空') as ApiResponse<any>);
    }

    const result = await authService.login({ phone, password });
    if ('error' in result) {
      const messages: Record<string, string> = {
        ACCOUNT_NOT_FOUND: '账号不存在，请检查手机号',
        PASSWORD_ERROR: '密码错误，请重试',
        INSUFFICIENT_PERMISSIONS: '权限不足，无法登录',
      };
      return res.status(401).json(buildErrorResponse(401, result.error, messages[result.error] || '登录失败') as ApiResponse<any>);
    }

    res.json({
      code: 200,
      message: '登录成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json(buildErrorResponse(500, 'SERVER_ERROR', '服务器错误') as ApiResponse<any>);
  }
};

export const sendSmsCode = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json(buildErrorResponse(400, 'BAD_REQUEST', '请输入手机号') as ApiResponse<any>);
    }

    const result = await authService.sendSmsCode(phone);
    if (!result.success) {
      return res.status(400).json(buildErrorResponse(400, 'SEND_FAILED', result.message) as ApiResponse<any>);
    }

    res.json({
      code: 200,
      message: result.message,
      data: { sent: true, expiresIn: 300 },
      timestamp: Date.now(),
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json(buildErrorResponse(500, 'SERVER_ERROR', '服务器错误') as ApiResponse<any>);
  }
};

export const loginBySms = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json(buildErrorResponse(400, 'BAD_REQUEST', '手机号和验证码不能为空') as ApiResponse<any>);
    }

    const result = await authService.loginBySms(phone, code);
    if ('error' in result) {
      const messages: Record<string, string> = {
        ACCOUNT_NOT_FOUND: '账号不存在，请检查手机号',
        VERIFY_CODE_ERROR: '验证码错误或已过期',
      };
      return res.status(401).json(buildErrorResponse(401, result.error, messages[result.error] || '登录失败') as ApiResponse<any>);
    }

    res.json({
      code: 200,
      message: '登录成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json(buildErrorResponse(500, 'SERVER_ERROR', '服务器错误') as ApiResponse<any>);
  }
};

export const loginByFace = async (req: Request, res: Response) => {
  try {
    const { faceImage } = req.body;
    if (!faceImage) {
      return res.status(400).json(buildErrorResponse(400, 'BAD_REQUEST', '人脸图像不能为空') as ApiResponse<any>);
    }

    const result = await authService.loginByFace(faceImage);
    if ('error' in result) {
      const messages: Record<string, string> = {
        ACCOUNT_NOT_FOUND: '未识别到匹配的账号',
        FACE_VERIFY_FAILED: '人脸验证未通过，请重试',
      };
      return res.status(401).json(buildErrorResponse(401, result.error, messages[result.error] || '登录失败') as ApiResponse<any>);
    }

    res.json({
      code: 200,
      message: '登录成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json(buildErrorResponse(500, 'SERVER_ERROR', '服务器错误') as ApiResponse<any>);
  }
};

export const faceVerify = async (req: Request, res: Response) => {
  try {
    const { faceImage } = req.body;
    if (!faceImage) {
      return res.status(400).json(buildErrorResponse(400, 'BAD_REQUEST', '人脸图像不能为空') as ApiResponse<any>);
    }

    const result = await authService.faceVerify(faceImage);
    res.json({
      code: 200,
      message: result.verified ? '认证成功' : '认证失败',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json(buildErrorResponse(500, 'SERVER_ERROR', '服务器错误') as ApiResponse<any>);
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const user = authService.getCurrentUser(token);
    
    if (!user) {
      return res.status(401).json(buildErrorResponse(401, 'TOKEN_INVALID', '登录已过期，请重新登录') as ApiResponse<any>);
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: user,
      timestamp: Date.now(),
    } as ApiResponse<typeof user>);
  } catch (error) {
    res.status(500).json(buildErrorResponse(500, 'SERVER_ERROR', '服务器错误') as ApiResponse<any>);
  }
};
