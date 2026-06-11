import { Router, Request, Response } from "express";
import {
  mockDriverProfiles,
  mockCargos,
  mockDriverGrowthConfig,
} from "../src/data/mockData.js";
import { recommendCargosForDriver } from "../src/services/matchService.js";

const router = Router();

router.post("/report-empty", (req: Request, res: Response) => {
  const { driverId, lat, lng, address } = req.body;
  const driver = mockDriverProfiles.find((d) => d.id === driverId);

  if (!driver) {
    return res.status(404).json({ code: 404, message: "司机不存在" });
  }

  driver.isEmpty = true;
  if (lat && lng) {
    driver.currentLocation = {
      lat,
      lng,
      address: address || driver.currentLocation.address,
    };
  }

  res.json({ code: 200, message: "空车状态上报成功", data: driver });
});

router.get("/recommend-cargos", (req: Request, res: Response) => {
  const driverId = (req.query.driverId as string) || "driver_001";
  const driver = mockDriverProfiles.find((d) => d.id === driverId);

  if (!driver) {
    return res.status(404).json({ code: 404, message: "司机不存在" });
  }

  const recommended = recommendCargosForDriver(driver, mockCargos);
  res.json({ code: 200, message: "success", data: recommended });
});

router.get("/nearby-cargos", (req: Request, res: Response) => {
  const published = mockCargos.filter((c) => c.status === "published");
  const withDistance = published.map((cargo) => ({
    cargo,
    distance: Math.round(Math.random() * 50 + 5),
  })).sort((a, b) => a.distance - b.distance);

  res.json({ code: 200, message: "success", data: withDistance });
});

router.get("/growth-config", (_req: Request, res: Response) => {
  res.json({ code: 200, message: "success", data: mockDriverGrowthConfig });
});

router.post("/exchange-points", (req: Request, res: Response) => {
  const { driverId, itemId } = req.body;
  const driver = mockDriverProfiles.find((d) => d.id === driverId);
  const item = mockDriverGrowthConfig.exchangeItems.find((i) => i.id === itemId);

  if (!driver || !item) {
    return res.status(404).json({ code: 404, message: "参数错误" });
  }

  if (driver.safeDrivingPoints < item.points) {
    return res.status(400).json({ code: 400, message: "积分不足" });
  }

  driver.safeDrivingPoints -= item.points;
  res.json({
    code: 200,
    message: "兑换成功",
    data: { remainingPoints: driver.safeDrivingPoints },
  });
});

export default router;
