import { Router } from "express";
import { repo } from "../data/repo.js";

const router = Router();

router.get("/", (req, res) => {
  const { status, stage } = req.query as Record<string, string>;
  const data = repo.listSubmissions({ status, stage });
  res.json({ data, total: data.length });
});

router.get("/:id", (req, res) => {
  const sub = repo.getSubmission(req.params.id);
  if (!sub) return res.status(404).json({ error: "Submission not found" });
  res.json(sub);
});

router.patch("/:id/status", (req, res) => {
  const { status, notes } = req.body as { status: string; notes?: string };
  const sub = repo.updateSubmissionStatus(req.params.id, status, notes);
  if (!sub) return res.status(404).json({ error: "Submission not found" });
  res.json(sub);
});

export default router;
