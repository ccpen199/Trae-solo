import { Router, type Request, type Response } from "express";
import { mockUser, mockAdminUser } from "../../src/data/mockData";
import type { User } from "../../src/types";

const router = Router();

interface LoginBody {
  username?: string;
  password?: string;
  phone?: string;
  smsCode?: string;
  loginType?: "citizen" | "enterprise" | "admin";
  loginMethod?: "password" | "sms" | "face" | "qrcode";
}

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: "注册成功",
  });
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { loginType = "citizen", loginMethod = "password" } = req.body as LoginBody;

  let user: User;
  if (loginType === "admin") {
    user = mockAdminUser;
  } else {
    user = {
      ...mockUser,
      userType: loginType === "enterprise" ? "enterprise" : "citizen",
    };
  }

  const token = Buffer.from(
    JSON.stringify({ userId: user.id, ts: Date.now() })
  ).toString("base64");

  res.json({
    success: true,
    data: {
      user,
      token,
      expiresIn: 86400,
    },
  });
});

router.post("/logout", async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: "已退出登录" });
});

router.get("/current", (req: Request, res: Response): void => {
  res.json({ success: true, data: mockUser });
});

export default router;
