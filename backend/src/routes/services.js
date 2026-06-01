const express = require("express");
const {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService
} = require("../controllers/serviceController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/", getServices);
router.get("/:id", getServiceById);
router.post("/", authenticate, createService);
router.put("/:id", authenticate, updateService);
router.delete("/:id", authenticate, deleteService);

module.exports = router;
