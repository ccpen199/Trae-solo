import express, { type Request, type Response } from "express";
import * as db from "../mock/data.js";

const router = express.Router();

router.get("/products", (req: Request, res: Response) => {
  const type = req.query.type as string;
  const limit = Number(req.query.limit);
  let list = db.financeProducts;
  if (type) list = list.filter((p) => p.type === type);
  if (limit) list = list.slice(0, limit);
  res.json(list);
});

router.get("/products/:id", (req: Request, res: Response) => {
  const p = db.financeProducts.find((x) => x.id === req.params.id);
  res.json(p || null);
});

router.post("/risk-assessment", (_req: Request, res: Response) => {
  res.json({
    score: 18,
    level: "balanced",
    recommendedTypes: ["wealth", "insurance"],
  });
});

router.get("/risk-assessment/result", (_req: Request, res: Response) => {
  res.json({
    score: 18,
    level: "balanced",
    recommendedTypes: ["wealth", "insurance"],
  });
});

router.post("/calculator", (req: Request, res: Response) => {
  const { amount = 200000, years = 3, annualRate = 4.35, method = "equal_payment" } = req.body;
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  const schedule: unknown[] = [];
  let balance = amount;
  if (method === "equal_payment") {
    const payment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    for (let i = 1; i <= months; i++) {
      const interest = balance * monthlyRate;
      const principal = payment - interest;
      balance = Math.max(0, balance - principal);
      schedule.push({ month: i, payment, principal, interest, balance });
    }
  }
  res.json({ schedule, totalPayment: schedule.reduce((s: number, r: any) => s + r.payment, 0) });
});

router.get("/contracts", (_req: Request, res: Response) => {
  res.json(db.contracts);
});

router.post("/contracts/:id/sign", (_req: Request, res: Response) => {
  res.json({ success: true, signedAt: new Date().toISOString() });
});

router.get("/fund/overview", (_req: Request, res: Response) => {
  res.json({
    totalAssets: 1256800,
    availableAmount: 1086800,
    frozenAmount: 170000,
    todayInflow: 80000,
    todayOutflow: 50600,
    supervisionStatus: "normal",
  });
});

router.get("/fund/transactions", (_req: Request, res: Response) => {
  res.json(db.fundTransactions);
});

export default router;
