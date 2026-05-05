const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, isManager } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/entry', reportController.getEntryReport);
router.get('/catering', reportController.getCateringReport);
router.get('/booklet', reportController.getBookletReport);
router.get('/department', reportController.getDepartmentReport);
router.get('/barcode-usage', reportController.getBarcodeUsageReport);

module.exports = router;
