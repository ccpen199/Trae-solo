import { Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export const successResponse = <T>(res: Response, data: T, message = '操作成功'): Response => {
  return res.json({
    code: 200,
    message,
    data,
    timestamp: Date.now()
  });
};

export const errorResponse = (res: Response, message: string, code = 400, data: any = null): Response => {
  return res.status(code).json({
    code,
    message,
    data,
    timestamp: Date.now()
  });
};

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const paginate = <T>(list: T[], page: number, pageSize: number): PaginationResult<T> => {
  const pageNum = Math.max(1, page);
  const size = Math.max(1, Math.min(100, pageSize));
  const total = list.length;
  const totalPages = Math.ceil(total / size);
  const start = (pageNum - 1) * size;
  const end = start + size;
  const paginatedList = list.slice(start, end);

  return {
    list: paginatedList,
    total,
    page: pageNum,
    pageSize: size,
    totalPages
  };
};

export const generateRequestNo = (prefix = 'REQ'): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${year}${month}${day}${random}`;
};

export const generateToken = (payload: { id: number; username: string; role: string }): string => {
  const secret = process.env.JWT_SECRET || 'changzhou-public-service-jwt-secret-key-2024';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(payload, secret, { expiresIn });
};

export const getTokenExpiry = (): Date => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    const now = new Date();
    
    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
    }
    
    return now;
  }
  
  const now = new Date();
  now.setDate(now.getDate() + 7);
  return now;
};

export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (err: Error, req: any, res: any, next: any) => {
  console.error(err.stack);
  return res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: process.env.NODE_ENV === 'development' ? err.message : null,
    timestamp: Date.now()
  });
};
