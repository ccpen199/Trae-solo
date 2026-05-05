import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// 认证中间件 - 验证 Token
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 从 Authorization header 获取 Token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未授权，请登录',
    });
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Token 无效或已过期',
    });
  }
  
  req.user = decoded;
  next();
}

// 角色中间件 - 检查用户角色
export function roleMiddleware(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未授权，请登录',
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      });
    }
    
    next();
  };
}

// 快捷中间件
export const requireAdmin = roleMiddleware('ADMIN');
export const requireSupervisor = roleMiddleware('SUPERVISOR', 'ADMIN');
export const requireEmployee = roleMiddleware('EMPLOYEE', 'SUPERVISOR', 'ADMIN');
