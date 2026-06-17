import { Router } from "express";
import { repo } from "../data/repo.js";

const router = Router();

router.get("/", (req, res) => {
  const { userId, type } = req.query as Record<string, string>;
  const data = repo.listTransactions({ userId, type });
  res.json({ data, total: data.length });
});

router.post("/withdraw", (req, res) => {
  const { userId, amount } = req.body as { userId: string; amount: number };
  const result: any = repo.createWithdrawal(userId, amount);
  if (result?.error) return res.status(400).json(result);
  res.status(201).json(result);
});

export default router;
