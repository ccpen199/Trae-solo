import { Request, Response, NextFunction } from 'express';
import { verify, JwtPayload } from '../utils/jwt';
import { error } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    error(res, '未提供认证令牌', 401);
    return;
  }

  const token = authHeader.slice(7);
  const payload = verify(token);

  if (!payload) {
    error(res, '认证令牌无效或已过期', 401);
    return;
  }

  req.user = payload;
  next();
};

export default authMiddleware;
