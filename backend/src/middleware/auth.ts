import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/enums";
import authService from "../services/authService";
import { unauthorized, forbidden } from "../utils/response";
import logger from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      unauthorized(res, "缺少认证令牌");
      return;
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    const user = await authService.getUserById(payload.userId);
    if (!user) {
      unauthorized(res, "用户不存在");
      return;
    }

    req.user = {
      id: user.id,
      role: user.role as UserRole,
    };

    next();
  } catch (error) {
    logger.error("认证失败", { error: error instanceof Error ? error.message : error });
    unauthorized(res, "无效的认证令牌");
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res, "请先登录");
      return;
    }

    if (!roles.includes(req.user.role)) {
      forbidden(res, "权限不足");
      return;
    }

    next();
  };
};
