import { Router } from "express";
import { db } from "../data/store.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ data: db.riskAlerts, total: db.riskAlerts.length });
});

router.post("/refresh", (_req, res) => {
  const alerts = db.refreshAlerts();
  res.json({ data: alerts, total: alerts.length });
});

router.patch("/:id/resolve", (req, res) => {
  const alert = db.riskAlerts.find((a) => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  alert.resolved = true;
  alert.processingStatus = "processed";
  res.json(alert);
});

export default router;
