import { Router, Request, Response } from "express";
import {
  mockUsers,
  mockDriverProfiles,
} from "../src/data/mockData.js";
import type { User, DriverProfile, LoginRequest } from "../../shared/types.js";

const router = Router();

router.post("/login", (req: Request, res: Response) => {
  const { phone, role } = req.body as LoginRequest;

  let user = mockUsers.find((u) => u.phone === phone && u.role === role);

  if (!user) {
    user = mockUsers.find((u) => u.role === role);
  }

  if (!user) {
    return res.status(401).json({ code: 401, message: "登录失败" });
  }

  let driverProfile: DriverProfile | null = null;
  if (role === "driver") {
    driverProfile =
      mockDriverProfiles.find((d) => d.userId === user.id) || null;
  }

  res.json({
    code: 200,
    message: "登录成功",
    data: {
      token: "mock_token_" + Date.now(),
      user,
      driverProfile,
    },
  });
});

router.get("/profile", (req: Request, res: Response) => {
  const userId = (req.headers["x-user-id"] as string) || "u_shipper_001";
  const user = mockUsers.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ code: 404, message: "用户不存在" });
  }

  let driverProfile: DriverProfile | null = null;
  if (user.role === "driver") {
    driverProfile =
      mockDriverProfiles.find((d) => d.userId === user.id) || null;
  }

  res.json({
    code: 200,
    message: "success",
    data: { user, driverProfile },
  });
});

export default router;
