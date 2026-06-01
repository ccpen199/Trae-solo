const express = require("express");
const {
  getStats,
  getTrend,
  getComplaintTypes,
  getNurseRanking,
  getMaterialCostsReport,
  getSummary,
  getCompletionRate,
  getComplaints,
  getRiskEvents,
  getNurseRatings,
  getMaterialCosts,
  getInventory
} = require("../controllers/reportController");

const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", authenticate, getStats);
router.get("/trend", authenticate, getTrend);
router.get("/complaint-types", authenticate, getComplaintTypes);
router.get("/nurse-ranking", authenticate, getNurseRanking);
router.get("/material-costs", authenticate, getMaterialCostsReport);

router.get("/summary", authenticate, getSummary);
router.get("/completion-rate", authenticate, getCompletionRate);
router.get("/complaints", authenticate, getComplaints);
router.get("/risk-events", authenticate, getRiskEvents);
router.get("/nurse-ratings", authenticate, getNurseRatings);
router.get("/inventory", authenticate, getInventory);

module.exports = router;
