const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');
const authMiddleware = require('../middleware/auth');

router.post('/pay', authMiddleware, paymentController.payOrder);
router.post('/rating', authMiddleware, paymentController.submitRating);
router.get('/rating/:orderId', authMiddleware, paymentController.getOrderRating);

module.exports = router;