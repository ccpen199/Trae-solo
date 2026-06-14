import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";

export interface AuthRequest extends Request {
  user?: User;
}

const getDemoUser = async (): Promise<User | null> => {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const userRepository = AppDataSource.getRepository(User);
  const demoUsername = process.env.DEMO_USERNAME || "admin";
  const demoUserId = Number(process.env.DEMO_USER_ID || "1");

  return (
    (await userRepository.findOne({ where: { username: demoUsername, isActive: true } })) ||
    (await userRepository.findOne({ where: { id: demoUserId, isActive: true } }))
  );
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const demoUser = await getDemoUser();
      if (demoUser) {
        req.user = demoUser;
        next();
        return;
      }

      res.status(401).json({ error: "未提供认证令牌" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { userId: number };

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.userId, isActive: true } });

    if (!user) {
      res.status(401).json({ error: "用户不存在或已被禁用" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "认证令牌无效或已过期" });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "未认证" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "权限不足" });
      return;
    }

    next();
  };
};
