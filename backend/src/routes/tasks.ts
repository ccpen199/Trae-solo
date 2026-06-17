import { Router } from "express";
import { repo } from "../data/repo.js";

const router = Router();

router.get("/stats", (_req, res) => {
  res.json(repo.platformStats());
});

router.get("/", (req, res) => {
  const { type, status, sort } = req.query as Record<string, string>;
  const data = repo.listTasks({ type, status, sort });
  res.json({ data, total: data.length });
});

router.get("/:id", (req, res) => {
  const task = repo.getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

router.post("/", (req, res) => {
  const task = repo.createTask(req.body);
  res.status(201).json(task);
});

router.patch("/:id", (req, res) => {
  const task = repo.updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

router.post("/:id/pricing", (req, res) => {
  const task = repo.getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  const record = repo.addPricingRecord(req.params.id, req.body);
  res.status(201).json(record);
});

export default router;
