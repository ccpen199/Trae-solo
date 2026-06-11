import { Router, Request, Response } from "express";
import { mockCargos, mockPricingModels, mockDriverProfiles } from "../src/data/mockData.js";
import type { Cargo } from "../../shared/types.js";
import { matchDrivers } from "../src/services/matchService.js";
import { calculateReferencePrice } from "../src/services/pricingService.js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const { status, shipperId } = req.query;
  let result = [...mockCargos];

  if (status) {
    result = result.filter((c) => c.status === status);
  }
  if (shipperId) {
    result = result.filter((c) => c.shipperId === shipperId);
  }

  res.json({ code: 200, message: "success", data: result });
});

router.get("/:id", (req: Request, res: Response) => {
  const cargo = mockCargos.find((c) => c.id === req.params.id);
  if (!cargo) {
    return res.status(404).json({ code: 404, message: "货源不存在" });
  }
  res.json({ code: 200, message: "success", data: cargo });
});

router.get("/:id/match-drivers", (req: Request, res: Response) => {
  const cargo = mockCargos.find((c) => c.id === req.params.id);
  if (!cargo) {
    return res.status(404).json({ code: 404, message: "货源不存在" });
  }

  const matched = matchDrivers(cargo, mockDriverProfiles);
  res.json({ code: 200, message: "success", data: matched });
});

router.post("/", (req: Request, res: Response) => {
  const body = req.body as Partial<Cargo>;

  if (!body.volume || !body.weight || !body.loadingMethod || body.insuranceRequired === undefined) {
    return res.status(400).json({
      code: 400,
      message: "请填写所有必填项：体积、重量、装卸方式、保险要求",
    });
  }

  const newCargo: Cargo = {
    id: "cargo_" + Date.now(),
    shipperId: body.shipperId || "u_shipper_001",
    title: body.title || "新货源",
    origin: body.origin || "",
    destination: body.destination || "",
    distance: body.distance || 0,
    volume: body.volume,
    weight: body.weight,
    cargoType: body.cargoType || "普通货物",
    loadingMethod: body.loadingMethod,
    insuranceRequired: body.insuranceRequired,
    insuranceAmount: body.insuranceAmount,
    expectedPrice: body.expectedPrice || 0,
    referencePrice: 0,
    status: "published",
    requiredVehicleTypes: body.requiredVehicleTypes || [],
    requiredQualifications: body.requiredQualifications || [],
    publishedAt: new Date().toISOString(),
    images: body.images || [],
  };

  newCargo.referencePrice = calculateReferencePrice(newCargo, mockPricingModels);
  mockCargos.unshift(newCargo);

  res.json({ code: 200, message: "发布成功", data: newCargo });
});

export default router;
