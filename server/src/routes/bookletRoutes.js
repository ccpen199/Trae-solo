const express = require('express');
const router = express.Router();
const bookletController = require('../controllers/bookletController');
const { authenticateToken, isOperator } = require('../middleware/auth');

router.use(authenticateToken);
router.use(isOperator);

router.post('/scan', bookletController.scanBooklet);
router.post('/batch-sync', bookletController.batchSyncBooklets);
router.get('/', bookletController.getBookletRecords);

module.exports = router;
