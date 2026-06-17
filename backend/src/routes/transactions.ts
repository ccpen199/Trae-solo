import { Router } from "express";
import { db } from "../data/store.js";

const router = Router();

router.get("/", (_req, res) => {
  const { userId, type } = _req.query as Record<string, string>;
  let result = [...db.transactions];
  if (userId) result = result.filter((t) => t.userId === userId);
  if (type) result = result.filter((t) => t.type === type);
  res.json({ data: result, total: result.length });
});

router.post("/withdraw", (req, res) => {
  const { userId, amount } = req.body as { userId: string; amount: number };
  const executor = db.executors.find((e) => e.id === userId);
  if (!executor) return res.status(404).json({ error: "Executor not found" });
  if (amount > executor.availableBalance) return res.status(400).json({ error: "余额不足" });
  if (amount > 5000) return res.status(400).json({ error: "单日提现限额5000元" });
  executor.availableBalance -= amount;
  executor.frozenBalance += amount;
  const txn = { id: `txn-${Date.now()}`, userId, userName: executor.name, type: "withdrawal" as const, amount, status: "pending" as const, description: `提现到银行卡(${executor.bankAccount})`, createdAt: new Date().toISOString() };
  db.transactions.push(txn);
  res.status(201).json(txn);
});

export default router;
