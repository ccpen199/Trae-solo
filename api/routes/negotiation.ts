import { Router, Request, Response } from "express";
import { mockWaybills, mockCargos } from "../src/data/mockData.js";
import type { NegotiationRecord } from "../../shared/types.js";

const router = Router();

router.get("/:cargoId", (req: Request, res: Response) => {
  const cargo = mockCargos.find((c) => c.id === req.params.cargoId);
  if (!cargo) {
    return res.status(404).json({ code: 404, message: "货源不存在" });
  }

  const waybill = mockWaybills.find((w) => w.cargoId === req.params.cargoId);
  const history: NegotiationRecord[] = waybill
    ? waybill.negotiationHistory
    : [
        {
          from: "shipper",
          price: cargo.expectedPrice,
          time: cargo.publishedAt,
          message: "初始报价",
        },
      ];

  res.json({ code: 200, message: "success", data: history });
});

router.post("/:cargoId/offer", (req: Request, res: Response) => {
  const { from, price, message } = req.body;
  const cargo = mockCargos.find((c) => c.id === req.params.cargoId);

  if (!cargo) {
    return res.status(404).json({ code: 404, message: "货源不存在" });
  }

  const record: NegotiationRecord = {
    from,
    price,
    time: new Date().toISOString(),
    message,
  };

  let waybill = mockWaybills.find((w) => w.cargoId === req.params.cargoId);
  if (waybill) {
    waybill.negotiationHistory.push(record);
  } else {
    waybill = {
      id: "waybill_" + Date.now(),
      cargoId: req.params.cargoId,
      shipperId: cargo.shipperId,
      driverId: "driver_001",
      agreedPrice: 0,
      status: "pending",
      negotiationHistory: [record],
      trackingPoints: [],
      createdAt: new Date().toISOString(),
    };
    mockWaybills.push(waybill);
  }

  res.json({ code: 200, message: "报价已发送", data: record });
});

export default router;
