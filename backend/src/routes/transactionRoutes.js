const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getMerchantStore, createMerchantStore, createTransaction, getTransactionStatus, getTransactionList, createRefund } = require('../controllers/transactionController');

router.get('/merchant', authenticateToken, getMerchantStore);
router.post('/merchant', authenticateToken, createMerchantStore);
router.post('/', authenticateToken, createTransaction);
router.get('/:id/status', getTransactionStatus);
router.get('/', authenticateToken, getTransactionList);
router.post('/:id/refund', authenticateToken, createRefund);

module.exports = router;