const express = require("express");
const {
  getOrders,
  getOrderDetail,
  createOrder,
  approveOrder,
  cancelOrder
} = require("../controllers/orderController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrderDetail);
router.post("/", authenticate, createOrder);
router.post("/:id/approve", authenticate, approveOrder);
router.post("/:id/cancel", authenticate, cancelOrder);

module.exports = router;
