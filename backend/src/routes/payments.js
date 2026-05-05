const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/statistics', authorize('report:read'), paymentController.getStatistics);

router.get('/', authorize('payment:read'), paymentController.getPayments);
router.get('/:id', authorize('payment:read'), paymentController.getPaymentById);
router.post('/', authorize('payment:write'), paymentController.createPayment);

module.exports = router;
