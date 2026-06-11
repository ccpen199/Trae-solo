import express, { type Request, type Response } from "express";
import * as db from "../mock/data.js";

const router = express.Router();

router.get("/overview", (_req: Request, res: Response) => {
  res.json({
    totalPaymentAmount: 226.58,
    totalPaymentCount: 69.3,
    totalUsers: 125.6,
    avgAmount: 326.8,
    yoyAmount: "+18.5%",
    momAmount: "+12.3%",
  });
});

router.get("/region", (_req: Request, res: Response) => {
  res.json(db.regionRanking);
});

router.get("/trend", (_req: Request, res: Response) => {
  res.json(db.trend7d);
});

router.get("/category", (_req: Request, res: Response) => {
  res.json([
    { name: "水费", value: 3520 },
    { name: "电费", value: 5680 },
    { name: "燃气费", value: 2180 },
    { name: "暖气费", value: 1650 },
    { name: "通讯费", value: 4250 },
    { name: "社保", value: 3890 },
    { name: "其他", value: 1420 },
  ]);
});

export default router;
