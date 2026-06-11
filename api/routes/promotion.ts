import express, { type Request, type Response } from "express";
import * as db from "../mock/data.js";

const router = express.Router();

router.get("/activities", (_req: Request, res: Response) => {
  res.json(db.promotions);
});

router.post("/activities", (_req: Request, res: Response) => {
  res.json({ success: true, activityId: "ACT" + Date.now() });
});

router.put("/activities/:id", (_req: Request, res: Response) => {
  res.json({ success: true });
});

router.get("/activities/:id/stats", (_req: Request, res: Response) => {
  res.json({
    impressions: 586420,
    clicks: 125680,
    participants: 25680,
    redeemed: 18960,
    roi: 4.2,
  });
});

export default router;
