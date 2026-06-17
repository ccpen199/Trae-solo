import { Router } from "express";
import { repo } from "../data/repo.js";

const router = Router();

router.get("/enterprises", (_req, res) => {
  res.json({ data: repo.listEnterprises() });
});

router.get("/executors", (_req, res) => {
  res.json({ data: repo.listExecutors() });
});

export default router;
