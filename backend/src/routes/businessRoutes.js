const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const businessController = require('../controllers/businessController');

router.get('/verification/:propertyId', authenticateToken, businessController.getVerificationDetails);
router.post('/verification', authenticateToken, businessController.submitVerification);

router.get('/service-orders', authenticateToken, businessController.getServiceOrders);
router.post('/service-orders', authenticateToken, businessController.createServiceOrder);
router.post('/service-orders/:orderId/pay', authenticateToken, businessController.payServiceOrder);
router.post('/service-orders/:orderId/complete', authenticateToken, businessController.completeServiceOrder);

router.get('/rent-index/details', businessController.getRentIndexDetails);

router.get('/dashboard/stats', authenticateToken, businessController.getDashboardStats);

router.get('/contracts/my', authenticateToken, businessController.getMyContracts);
router.post('/contracts/:contractId/sign', authenticateToken, businessController.signContract);

router.get('/escrow', authenticateToken, businessController.getEscrowFunds);

router.get('/insurance', authenticateToken, businessController.getInsurancePolicies);

router.get('/disputes', authenticateToken, businessController.getDisputes);
router.post('/disputes', authenticateToken, businessController.createDispute);

module.exports = router;
