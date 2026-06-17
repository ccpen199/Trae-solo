import { Router } from "express";
import { db } from "../data/store.js";

const router = Router();

router.get("/", (_req, res) => {
  const { type, status, sort } = _req.query as Record<string, string>;
  let result = [...db.tasks];
  if (type && type !== "all") result = result.filter((t) => t.type === type);
  if (status) result = result.filter((t) => t.status === status);
  if (sort === "reward") result.sort((a, b) => b.reward - a.reward);
  else if (sort === "difficulty") result.sort((a, b) => a.difficulty - b.difficulty);
  else if (sort === "completion") result.sort((a, b) => b.completionRate - a.completionRate);
  else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ data: result, total: result.length });
});

router.get("/stats", (_req, res) => {
  res.json(db.getPlatformStats());
});

router.get("/:id", (req, res) => {
  const task = db.findTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

router.post("/", (req, res) => {
  const task = db.createTask(req.body);
  res.status(201).json(task);
});

router.patch("/:id", (req, res) => {
  const task = db.updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

router.post("/:id/pricing", (req, res) => {
  const record = db.addPricingRecord(req.params.id, req.body);
  if (!record) return res.status(404).json({ error: "Task not found" });
  res.status(201).json(record);
});

export default router;
