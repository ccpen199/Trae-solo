const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');

router.get('/confirmations', settlementController.getConfirmations);
router.post('/confirmations', settlementController.createConfirmation);
router.put('/confirmations/:id', settlementController.updateConfirmation);

router.get('/', settlementController.getSettlements);
router.post('/', settlementController.createSettlement);
router.put('/:id', settlementController.updateSettlement);

router.get('/dashboard/stats', settlementController.getDashboardStats);

module.exports = router;
