import { Router } from "express";
import { db } from "../data/store.js";

const router = Router();

router.get("/", (_req, res) => {
  const { status, stage } = _req.query as Record<string, string>;
  let result = [...db.submissions];
  if (status) result = result.filter((s) => s.status === status);
  if (stage === "ai_review") result = result.filter((s) => s.status === "pending" || s.status === "ai_flagged");
  else if (stage === "manual_review") result = result.filter((s) => s.status === "ai_flagged" || s.status === "manual_passed" || s.status === "manual_rejected");
  else if (stage === "dispute") result = result.filter((s) => s.status === "disputed" || s.status === "arbitrated");
  res.json({ data: result, total: result.length });
});

router.get("/:id", (req, res) => {
  const sub = db.findSubmission(req.params.id);
  if (!sub) return res.status(404).json({ error: "Submission not found" });
  res.json(sub);
});

router.patch("/:id/status", (req, res) => {
  const { status, notes } = req.body as { status: string; notes?: string };
  const sub = db.updateSubmissionStatus(req.params.id, status as any, notes);
  if (!sub) return res.status(404).json({ error: "Submission not found" });
  res.json(sub);
});

export default router;
