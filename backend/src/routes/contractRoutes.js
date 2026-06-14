const express = require('express');
const contractController = require('../controllers/contractController');
const { authenticateToken, requireVerified } = require('../middleware/auth');

const router = express.Router();

router.get('/my', authenticateToken, contractController.getMyContracts);
router.get('/my/payments', authenticateToken, contractController.getMyPayments);
router.get('/my/disputes', authenticateToken, contractController.getMyDisputes);

router.get('/:id', authenticateToken, contractController.getContractById);
router.post('/', authenticateToken, requireVerified, contractController.createContract);
router.post('/:id/sign', authenticateToken, contractController.signContract);

router.post('/payments', authenticateToken, contractController.createPayment);
router.post('/payments/:paymentId/process', authenticateToken, contractController.processPayment);

router.post('/disputes', authenticateToken, contractController.createDispute);

module.exports = router;
