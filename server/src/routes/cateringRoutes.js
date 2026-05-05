const express = require('express');
const router = express.Router();
const cateringController = require('../controllers/cateringController');
const { authenticateToken, isOperator } = require('../middleware/auth');

router.use(authenticateToken);
router.use(isOperator);

router.post('/scan', cateringController.scanCatering);
router.post('/batch-sync', cateringController.batchSyncCatering);
router.get('/', cateringController.getCateringRecords);

module.exports = router;
