import { Response } from "express";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import { AuthRequest } from "../middleware/auth";
import { hashPassword, comparePassword, generateToken } from "../utils/encryption";
import { auditLog } from "../middleware/audit";

export class AuthController {
  public static async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "用户名和密码不能为空" });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { username } });

      if (!user) {
        res.status(401).json({ error: "用户名或密码错误" });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ error: "用户已被禁用" });
        return;
      }

      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        res.status(401).json({ error: "用户名或密码错误" });
        return;
      }

      const token = generateToken(user.id);

      await auditLog("login", req, user.id, "User", undefined, { loginAt: new Date() }, "用户登录");

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "登录失败" });
    }
  }

  public static async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, password, name, email, phone, role, department } = req.body;

      if (!username || !password || !name || !email) {
        res.status(400).json({ error: "必填字段不能为空" });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);

      const existingUser = await userRepository.findOne({
        where: [{ username }, { email }],
      });

      if (existingUser) {
        res.status(400).json({ error: "用户名或邮箱已存在" });
        return;
      }

      const hashedPassword = await hashPassword(password);

      const user = userRepository.create({
        username,
        password: hashedPassword,
        name,
        email,
        phone,
        role: role || "hr",
        department,
        isActive: true,
      });

      await userRepository.save(user);

      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        message: "注册成功",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "注册失败" });
    }
  }

  public static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (req.user) {
        await auditLog("logout", req, req.user.id, "User", undefined, undefined, "用户登出");
      }

      res.json({ message: "登出成功" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "登出失败" });
    }
  }

  public static async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      const { password: _, ...userWithoutPassword } = req.user;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "获取用户信息失败" });
    }
  }

  public static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!req.user) {
        res.status(401).json({ error: "未认证" });
        return;
      }

      if (!oldPassword || !newPassword) {
        res.status(400).json({ error: "原密码和新密码不能为空" });
        return;
      }

      const isValid = await comparePassword(oldPassword, req.user.password);
      if (!isValid) {
        res.status(400).json({ error: "原密码错误" });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: "新密码长度不能少于6位" });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const hashedPassword = await hashPassword(newPassword);

      await userRepository.update(req.user.id, { password: hashedPassword });

      res.json({ message: "密码修改成功" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "密码修改失败" });
    }
  }

  public static async initDefaultUsers(): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const count = await userRepository.count();

      if (count === 0) {
        const defaultUsers = [
          {
            username: "admin",
            password: await hashPassword("admin123"),
            name: "系统管理员",
            email: "admin@example.com",
            phone: "13800000001",
            role: "admin" as const,
            department: "人事部",
            isActive: true,
          },
          {
            username: "hr",
            password: await hashPassword("hr123456"),
            name: "HR专员",
            email: "hr@example.com",
            phone: "13800000002",
            role: "hr" as const,
            department: "人事部",
            isActive: true,
          },
          {
            username: "manager",
            password: await hashPassword("manager123"),
            name: "技术经理",
            email: "manager@example.com",
            phone: "13800000003",
            role: "hiring_manager" as const,
            department: "技术部",
            isActive: true,
          },
          {
            username: "interviewer",
            password: await hashPassword("interview123"),
            name: "面试官",
            email: "interviewer@example.com",
            phone: "13800000004",
            role: "interviewer" as const,
            department: "技术部",
            isActive: true,
          },
        ];

        for (const userData of defaultUsers) {
          const user = userRepository.create(userData);
          await userRepository.save(user);
        }

        console.log("Default users created successfully");
      }
    } catch (error) {
      console.error("Init default users error:", error);
    }
  }
}
