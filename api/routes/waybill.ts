import { Router, Request, Response } from "express";
import { mockWaybills, mockCargos, mockDriverProfiles } from "../src/data/mockData.js";
import { generateBlockchainHash, detectTrackAnomaly } from "../src/services/riskService.js";
import type { Waybill, TrackingPoint } from "../../shared/types.js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const { status, shipperId, driverId } = req.query;
  let result = [...mockWaybills];

  if (status) result = result.filter((w) => w.status === status);
  if (shipperId) result = result.filter((w) => w.shipperId === shipperId);
  if (driverId) result = result.filter((w) => w.driverId === driverId);

  res.json({ code: 200, message: "success", data: result });
});

router.get("/:id", (req: Request, res: Response) => {
  const waybill = mockWaybills.find((w) => w.id === req.params.id);
  if (!waybill) {
    return res.status(404).json({ code: 404, message: "运单不存在" });
  }

  const cargo = mockCargos.find((c) => c.id === waybill.cargoId);
  const driver = mockDriverProfiles.find((d) => d.id === waybill.driverId);
  const anomaly = detectTrackAnomaly(waybill);

  res.json({
    code: 200,
    message: "success",
    data: { ...waybill, cargo, driver, trackAnomaly: anomaly },
  });
});

router.post("/", (req: Request, res: Response) => {
  const { cargoId, driverId, agreedPrice } = req.body;
  const cargo = mockCargos.find((c) => c.id === cargoId);

  if (!cargo) {
    return res.status(404).json({ code: 404, message: "货源不存在" });
  }

  const newWaybill: Waybill = {
    id: "waybill_" + Date.now(),
    cargoId,
    shipperId: cargo.shipperId,
    driverId,
    agreedPrice,
    status: "pending",
    negotiationHistory: [],
    blockchainHash: generateBlockchainHash(cargoId),
    trackingPoints: [],
    createdAt: new Date().toISOString(),
  };

  cargo.status = "matched";
  mockWaybills.unshift(newWaybill);

  res.json({ code: 200, message: "运单创建成功", data: newWaybill });
});

router.post("/:id/track", (req: Request, res: Response) => {
  const waybill = mockWaybills.find((w) => w.id === req.params.id);
  if (!waybill) {
    return res.status(404).json({ code: 404, message: "运单不存在" });
  }

  const { lat, lng, speed } = req.body;
  const point: TrackingPoint = {
    lat,
    lng,
    speed,
    time: new Date().toISOString(),
  };

  waybill.trackingPoints.push(point);
  res.json({ code: 200, message: "轨迹上报成功", data: point });
});

router.put("/:id/status", (req: Request, res: Response) => {
  const waybill = mockWaybills.find((w) => w.id === req.params.id);
  if (!waybill) {
    return res.status(404).json({ code: 404, message: "运单不存在" });
  }

  const { status } = req.body;
  waybill.status = status;

  if (status === "completed") {
    waybill.actualArrival = new Date().toISOString();
  }

  res.json({ code: 200, message: "状态更新成功", data: waybill });
});

export default router;
