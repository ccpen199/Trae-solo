import { Router } from "express";
import authRoutes from "./auth";
import projectRoutes from "./projects";
import moduleRoutes from "./modules";
import bugRoutes from "./bugs";

const router = Router();

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/modules", moduleRoutes);
router.use("/bugs", bugRoutes);

export default router;
