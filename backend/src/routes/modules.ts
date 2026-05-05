import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import * as moduleController from "../controllers/moduleController";
import { UserRole } from "../utils/enums";

const router = Router();

router.use(authenticate);

router.get("/project/:projectId", moduleController.getModules);
router.get("/project/:projectId/tree", moduleController.getModuleTree);
router.get("/:id", moduleController.getModuleById);

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  moduleController.createModule
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  moduleController.updateModule
);

router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  moduleController.deleteModule
);

router.post(
  "/reorder",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  moduleController.reorderModules
);

router.post(
  "/:id/move",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  moduleController.moveModule
);

export default router;
