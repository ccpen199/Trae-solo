const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
const auth = require('../middleware/auth');

router.get('/', auth('operator', 'property', 'resident'), workOrderController.getWorkOrders);
router.get('/:id', auth('operator', 'property', 'resident'), workOrderController.getWorkOrderById);
router.post('/', auth(), workOrderController.createWorkOrder);
router.post('/:id/assign', auth('operator', 'property'), workOrderController.assignWorkOrder);
router.post('/:id/status', auth('operator', 'property'), workOrderController.updateWorkOrderStatus);

module.exports = router;
