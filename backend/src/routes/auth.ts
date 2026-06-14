import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";
import { encryptionMiddleware } from "../middleware/encryption";
import { validateBody } from "../middleware/validation";
import authService from "../services/authService";
import { success, error } from "../utils/response";
import { UserRole } from "../types/enums";
import prisma from "../lib/prisma";
import encryptionService from "../services/encryptionService";

const router = Router();

const registerSchema = z.object({
  phone: z.string().length(11, "手机号必须为11位"),
  name: z.string().min(2, "姓名至少2个字符"),
  idCard: z.string().length(18, "身份证号必须为18位"),
  email: z.string().email("邮箱格式不正确").optional(),
  password: z.string().min(6, "密码至少6位"),
});

const loginSchema = z.object({
  phone: z.string().length(11, "手机号必须为11位"),
  password: z.string().min(6, "密码至少6位"),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, "原密码至少6位"),
  newPassword: z.string().min(6, "新密码至少6位"),
});

router.post(
  "/register",
  validateBody(registerSchema),
  encryptionMiddleware,
  auditMiddleware({ action: "REGISTER", targetType: "USER", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data);
      success(
        res,
        {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
        "注册成功",
        201
      );
    } catch (err) {
      if (err instanceof Error) {
        error(res, "REGISTER_ERROR", err.message, undefined, 400);
        return;
      }
      throw err;
    }
  }
);

router.post(
  "/login",
  validateBody(loginSchema),
  auditMiddleware({ action: "LOGIN", targetType: "USER", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = loginSchema.parse(req.body);
      const { user, token } = await authService.login(data);
      success(
        res,
        {
          token,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          },
        },
        "登录成功"
      );
    } catch (err) {
      if (err instanceof Error) {
        error(res, "LOGIN_ERROR", err.message, undefined, 400);
        return;
      }
      throw err;
    }
  }
);

router.get(
  "/me",
  authenticate,
  auditMiddleware({ action: "GET_PROFILE", targetType: "USER" }),
  async (req: Request, res: Response): Promise<void> => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    if (!user) {
      error(res, "NOT_FOUND", "用户不存在", undefined, 404);
      return;
    }

    let idCard = undefined;
    try {
      idCard = encryptionService.decrypt(user.idCardEncrypted);
      idCard = encryptionService.maskIdCard(idCard);
    } catch (e) {
      // 解密失败，不返回
    }

    success(res, {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      idCard,
      createdAt: user.createdAt,
    });
  }
);

router.post(
  "/logout",
  authenticate,
  auditMiddleware({ action: "LOGOUT", targetType: "USER" }),
  (req: Request, res: Response): void => {
    success(res, undefined, "退出登录成功");
  }
);

router.put(
  "/password",
  authenticate,
  validateBody(changePasswordSchema),
  auditMiddleware({ action: "CHANGE_PASSWORD", targetType: "USER", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user!.id, data.oldPassword, data.newPassword);
      success(res, undefined, "密码修改成功");
    } catch (err) {
      if (err instanceof Error) {
        error(res, "PASSWORD_ERROR", err.message, undefined, 400);
        return;
      }
      throw err;
    }
  }
);

export default router;
