const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
const authMiddleware = require('../middleware/auth');

router.get('/car-types', orderController.getCarTypes);
router.post('/calculate', authMiddleware, orderController.calculateRoute);
router.post('/', authMiddleware, orderController.createOrder);
router.get('/current', authMiddleware, orderController.getCurrentOrder);
router.get('/history', authMiddleware, orderController.getOrderHistory);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.put('/:id/status', authMiddleware, orderController.updateOrderStatus);
router.post('/:id/driver-arrive', authMiddleware, orderController.simulateDriverArrive);
router.post('/:id/trip-complete', authMiddleware, orderController.simulateTripComplete);

module.exports = router;