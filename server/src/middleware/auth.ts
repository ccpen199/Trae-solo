import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, ApiResponse } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'homestay_jwt_secret_key_2024';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const response: ApiResponse = {
      success: false,
      message: '未登录，请先登录',
    };
    return res.status(401).json(response);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: '登录已过期，请重新登录',
    };
    return res.status(403).json(response);
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded;
    } catch (error) {
      // Token无效，继续执行但不设置用户
    }
  }
  next();
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
