import { Router } from "express";
import { db } from "../data/store.js";

const router = Router();

router.get("/enterprises", (_req, res) => {
  res.json({ data: db.enterprises });
});

router.get("/enterprises/:id", (req, res) => {
  const ent = db.findEnterprise(req.params.id);
  if (!ent) return res.status(404).json({ error: "Enterprise not found" });
  res.json(ent);
});

router.get("/executors", (_req, res) => {
  res.json({ data: db.executors });
});

router.get("/executors/:id", (req, res) => {
  const exe = db.findExecutor(req.params.id);
  if (!exe) return res.status(404).json({ error: "Executor not found" });
  res.json(exe);
});

export default router;
