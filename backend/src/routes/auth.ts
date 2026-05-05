import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import * as authController from "../controllers/authController";
import { UserRole } from "../utils/enums";

const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);

router.get("/me", authenticate, authController.getCurrentUser);
router.post("/change-password", authenticate, authController.changePassword);

router.get("/users", authenticate, authorize(UserRole.ADMIN), authController.getUsers);
router.post("/users", authenticate, authorize(UserRole.ADMIN), authController.createUser);
router.put("/users/:id", authenticate, authorize(UserRole.ADMIN), authController.updateUser);
router.delete("/users/:id", authenticate, authorize(UserRole.ADMIN), authController.deleteUser);

export default router;
