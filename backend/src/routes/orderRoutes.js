const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, orderController.getMyOrders);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.post('/', authenticateToken, orderController.createOrder);
router.post('/:id/cancel', authenticateToken, orderController.cancelOrder);
router.post('/:id/confirm', authenticateToken, orderController.confirmOrder);
router.put('/:id/status', authenticateToken, orderController.updateOrderStatus);

module.exports = router;
