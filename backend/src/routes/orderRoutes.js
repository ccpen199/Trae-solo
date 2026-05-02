const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/todos/count', authMiddleware, orderController.getTodoCount);
router.get('/', authMiddleware, orderController.getOrderList);
router.get('/:id', authMiddleware, orderController.getOrderDetail);
router.post('/', authMiddleware, orderController.createOrder);
router.post('/:id/submit-query', authMiddleware, roleMiddleware(['agent', 'admin']), orderController.submitQuery);
router.post('/:id/select-cabin', authMiddleware, orderController.selectCabin);
router.post('/:id/pay-issue', authMiddleware, orderController.payAndIssue);
router.post('/:id/rebook-refund', authMiddleware, orderController.createRebookRefundRequest);
router.post('/rebook-refund/:id/process', authMiddleware, roleMiddleware(['customer_service', 'agent', 'admin']), orderController.processRebookRefund);

module.exports = router;
