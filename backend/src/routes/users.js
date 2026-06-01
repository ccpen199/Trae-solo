const express = require("express");
const {
  getUsers,
  getNurses,
  getUserById,
  createUser,
  createNurse,
  updateUser,
  updateNurse,
  deleteUser
} = require("../controllers/userController");

const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getUsers);
router.get("/nurses", authenticate, authorize("admin"), getNurses);
router.get("/:id", authenticate, getUserById);
router.post("/", authenticate, authorize("admin"), createUser);
router.post("/nurses", authenticate, authorize("admin"), createNurse);
router.put("/:id", authenticate, authorize("admin"), updateUser);
router.put("/nurses/:id", authenticate, authorize("admin"), updateNurse);
router.delete("/:id", authenticate, authorize("admin"), deleteUser);

module.exports = router;
