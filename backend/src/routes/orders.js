const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getOrders);
router.get('/engineers/recommend', orderController.getSuitableEngineers);
router.get('/:id', orderController.getOrder);
router.post('/', orderController.createOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.post('/:id/assign', orderController.assignEngineer);
router.post('/:id/evidence', orderController.uploadEvidence);
router.post('/:id/rating', orderController.addRating);

module.exports = router;
