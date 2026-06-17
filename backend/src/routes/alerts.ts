import { Router } from "express";
import { repo } from "../data/repo.js";

const router = Router();

router.get("/", (_req, res) => {
  const data = repo.listAlerts();
  res.json({ data, total: data.length });
});

router.post("/refresh", (_req, res) => {
  const data = repo.refreshAlerts();
  res.json({ data, total: data.length });
});

router.patch("/:id/resolve", (req, res) => {
  const alert = repo.resolveAlert(req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  res.json(alert);
});

export default router;
