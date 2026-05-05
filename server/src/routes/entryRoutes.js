const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entryController');
const { authenticateToken, isOperator } = require('../middleware/auth');

router.use(authenticateToken);
router.use(isOperator);

router.post('/scan', entryController.scanEntry);
router.post('/batch-sync', entryController.batchSyncEntries);
router.get('/', entryController.getEntryRecords);
router.get('/:id', entryController.getEntryRecordById);

module.exports = router;
