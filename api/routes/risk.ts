import { Router, Request, Response } from "express";
import { mockRiskAlerts, mockUsers } from "../src/data/mockData.js";
import { evaluateShipperCredit, getRiskOverview } from "../src/services/riskService.js";

const router = Router();

router.get("/alerts", (req: Request, res: Response) => {
  const { level, isRead } = req.query;
  let result = [...mockRiskAlerts];

  if (level) result = result.filter((a) => a.level === level);
  if (isRead !== undefined) {
    result = result.filter((a) => a.isRead === (isRead === "true"));
  }

  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json({ code: 200, message: "success", data: result });
});

router.post("/alerts/:id/read", (req: Request, res: Response) => {
  const alert = mockRiskAlerts.find((a) => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ code: 404, message: "告警不存在" });
  }
  alert.isRead = true;
  res.json({ code: 200, message: "success" });
});

router.post("/evaluate-credit", (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = mockUsers.find((u) => u.id === userId || u.id === "u_shipper_001");

  if (!user) {
    return res.status(404).json({ code: 404, message: "用户不存在" });
  }

  const result = evaluateShipperCredit(user);
  res.json({ code: 200, message: "success", data: result });
});

export default router;
