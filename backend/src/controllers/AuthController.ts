import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities';
import { generateToken, getRoleDisplay, AuthenticatedRequest } from '../middleware';
import * as response from '../utils/response';
import bcrypt from 'bcryptjs';

export class AuthController {
  private userRepo;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json(response.badRequest('用户名和密码不能为空'));
      }

      const user = await this.userRepo.findOne({
        where: { username },
      });

      if (!user) {
        return res.status(401).json(response.unauthorized('用户名或密码错误'));
      }

      if (!user.active) {
        return res.status(403).json(response.forbidden('用户已被禁用'));
      }

      const isPasswordValid = await this.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json(response.unauthorized('用户名或密码错误'));
      }

      const token = generateToken(user);

      res.json(
        response.success({
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            roleDisplay: getRoleDisplay(user.role),
            companyName: user.companyName,
            email: user.email,
            phone: user.phone,
          },
          token,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json(response.unauthorized('未登录'));
      }

      res.json(
        response.success({
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          roleDisplay: getRoleDisplay(user.role),
          companyName: user.companyName,
          email: user.email,
          phone: user.phone,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async getUserList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await this.userRepo.find({
        where: { active: true },
        order: { createdAt: 'DESC' },
      });

      const userList = users.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        roleDisplay: getRoleDisplay(user.role),
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        active: user.active,
      }));

      res.json(response.success(userList));
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json(response.badRequest('旧密码和新密码不能为空'));
      }

      if (newPassword.length < 6) {
        return res.status(400).json(response.badRequest('新密码长度不能少于6位'));
      }

      const isOldPasswordValid = await this.verifyPassword(oldPassword, user!.password);
      if (!isOldPasswordValid) {
        return res.status(400).json(response.badRequest('旧密码错误'));
      }

      user!.password = await this.hashPassword(newPassword);
      await this.userRepo.save(user!);

      res.json(response.success(undefined, '密码修改成功'));
    } catch (error) {
      next(error);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async ensurePasswordHash(): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find();

    for (const user of users) {
      if (!user.password.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;
        await userRepo.save(user);
      }
    }
  }
}
