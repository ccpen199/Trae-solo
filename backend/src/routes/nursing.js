const express = require("express");
const {
  checkin,
  checkout,
  submitRecord,
  getRecord,
  getNurses,
  createNurse
} = require("../controllers/nursingController");

const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/checkin", authenticate, checkin);
router.post("/checkout", authenticate, checkout);
router.post("/record", authenticate, submitRecord);
router.get("/record/:order_id", authenticate, getRecord);
router.get("/nurses", authenticate, getNurses);
router.post("/nurses", authenticate, createNurse);

module.exports = router;
