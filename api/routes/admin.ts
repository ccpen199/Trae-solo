import { Router, Request, Response } from "express";
import {
  mockPricingModels,
  mockRiskAlerts,
  mockDriverGrowthConfig,
  mockCargos,
  mockWaybills,
  mockDriverProfiles,
} from "../src/data/mockData.js";
import { getRiskOverview } from "../src/services/riskService.js";
import { getPriceTrend } from "../src/services/pricingService.js";

const router = Router();

router.get("/dashboard", (_req: Request, res: Response) => {
  const totalCargos = mockCargos.length;
  const totalWaybills = mockWaybills.length;
  const activeWaybills = mockWaybills.filter((w) => w.status === "shipping").length;
  const totalDrivers = mockDriverProfiles.length;
  const emptyDrivers = mockDriverProfiles.filter((d) => d.isEmpty).length;
  const totalRevenue = mockWaybills
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + w.agreedPrice, 0);

  const revenueTrend: number[] = [];
  for (let i = 0; i < 7; i++) {
    revenueTrend.push(Math.round(Math.random() * 50000 + 20000));
  }

  res.json({
    code: 200,
    message: "success",
    data: {
      totalCargos,
      totalWaybills,
      activeWaybills,
      totalDrivers,
      emptyDrivers,
      totalRevenue,
      revenueTrend,
      orderTrend: [42, 58, 63, 71, 85, 92, 88],
    },
  });
});

router.get("/pricing-model", (_req: Request, res: Response) => {
  const data = mockPricingModels.map((model) => ({
    ...model,
    trend: getPriceTrend(`${model.route.origin}-${model.route.destination}`),
  }));
  res.json({ code: 200, message: "success", data });
});

router.put("/pricing-model/:id", (req: Request, res: Response) => {
  const model = mockPricingModels.find((p) => p.id === req.params.id);
  if (!model) {
    return res.status(404).json({ code: 404, message: "运价模型不存在" });
  }

  Object.assign(model, req.body, { updatedAt: new Date().toISOString() });
  res.json({ code: 200, message: "更新成功", data: model });
});

router.get("/risk-overview", (_req: Request, res: Response) => {
  const data = getRiskOverview(mockRiskAlerts);
  res.json({ code: 200, message: "success", data });
});

router.get("/driver-growth", (_req: Request, res: Response) => {
  const driversWithLevel = mockDriverProfiles.map((d) => {
    const levelConfig = mockDriverGrowthConfig.levels.find(
      (l) => l.level === d.level
    );
    return {
      ...d,
      levelName: levelConfig?.name || "未知",
      nextLevelPoints:
        mockDriverGrowthConfig.levels.find((l) => l.level === d.level + 1)
          ?.minPoints || null,
    };
  });

  res.json({
    code: 200,
    message: "success",
    data: {
      config: mockDriverGrowthConfig,
      drivers: driversWithLevel,
    },
  });
});

export default router;
