import express, { type Request, type Response } from "express";
import * as db from "../mock/data.js";

const router = express.Router();

router.get("/profit-rules", (_req: Request, res: Response) => {
  res.json(db.profitRules);
});

router.post("/profit-rules", (_req: Request, res: Response) => {
  res.json({ success: true, ruleId: "PR" + Date.now() });
});

router.get("/settlements", (_req: Request, res: Response) => {
  res.json(db.settlements);
});

router.post("/settle", (_req: Request, res: Response) => {
  res.json({ success: true, batchId: "ST" + Date.now() });
});

export default router;
