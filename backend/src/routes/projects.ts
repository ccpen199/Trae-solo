import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import * as projectController from "../controllers/projectController";
import { UserRole } from "../utils/enums";

const router = Router();

router.use(authenticate);

router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProjectById);
router.get("/:id/tree", projectController.getProjectTree);

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  projectController.createProject
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  projectController.updateProject
);

router.delete(
  "/:id",
  authorize(UserRole.ADMIN),
  projectController.deleteProject
);

router.post(
  "/reorder",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  projectController.reorderProjects
);

export default router;
