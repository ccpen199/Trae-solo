const express = require("express");
const {
  getDispatchTasks,
  getRecommendedNurses,
  assignTask,
  acceptTask,
  rejectTask,
  completeTask
} = require("../controllers/dispatchController");

const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/tasks", authenticate, getDispatchTasks);
router.get("/recommended-nurses/:order_id", authenticate, getRecommendedNurses);
router.post("/assign/:order_id", authenticate, assignTask);
router.post("/tasks/:id/accept", authenticate, acceptTask);
router.post("/tasks/:id/reject", authenticate, rejectTask);
router.post("/tasks/:id/complete", authenticate, completeTask);

module.exports = router;
