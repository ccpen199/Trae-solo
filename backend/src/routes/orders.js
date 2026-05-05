const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/statistics', authorize('report:read'), orderController.getStatistics);

router.get('/', authorize('order:read'), orderController.getOrders);
router.get('/:id', authorize('order:read'), orderController.getOrderById);
router.post('/', authorize('order:write'), orderController.createOrder);
router.put('/:id/items', authorize('order:write'), orderController.updateOrderItems);
router.patch('/:id/status', authorize('order:write'), orderController.updateOrderStatus);

module.exports = router;
