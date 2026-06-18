const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.get('/wallet', auth(), orderController.getWallet);
router.get('/', auth(), orderController.getOrders);
router.get('/:id', auth(), orderController.getOrderById);
router.post('/', auth(), orderController.createOrder);
router.post('/recharge', auth(), orderController.recharge);
router.post('/:id/pay', auth(), orderController.payOrder);
router.post('/:id/complete', auth('operator', 'property'), orderController.completeOrder);
router.post('/interrupt', auth(), orderController.handleInterrupt);

module.exports = router;
