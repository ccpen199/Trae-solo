const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { createOrderValidator, idParamValidator } = require('../middleware/validators');

router.get('/', authenticate, orderController.getMyOrders);

router.post('/', authenticate, createOrderValidator, orderController.createOrder);

router.get('/:id', authenticate, idParamValidator, orderController.getOrderDetail);

router.put('/:id/status', authenticate, idParamValidator, orderController.updateOrderStatus);

module.exports = router;
