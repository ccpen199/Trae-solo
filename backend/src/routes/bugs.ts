import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import * as bugController from "../controllers/bugController";
import { UserRole } from "../utils/enums";

const router = Router();

router.use(authenticate);

router.get("/", bugController.getBugs);
router.get("/:id", bugController.getBugById);
router.get("/:id/history", bugController.getBugHistory);
router.get("/transitions/:status", bugController.getAllowedTransitions);

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD, UserRole.TESTER),
  bugController.createBug
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD, UserRole.TESTER, UserRole.DEVELOPER),
  bugController.updateBug
);

router.put(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD, UserRole.TESTER, UserRole.DEVELOPER),
  bugController.updateBugStatus
);

router.post(
  "/publish",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  bugController.publishBugs
);

router.post(
  "/:id/assign",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  bugController.assignBug
);

router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.TEST_LEAD),
  bugController.deleteBug
);

export default router;
