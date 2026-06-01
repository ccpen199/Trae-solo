const express = require('express');
const router = express.Router();
const controlPlanController = require('../controllers/controlPlanController');

router.get('/', controlPlanController.getAllPlans);
router.post('/', controlPlanController.createPlan);
router.put('/:id', controlPlanController.updatePlan);
router.delete('/:id', controlPlanController.deletePlan);
router.post('/:id/adjust', controlPlanController.adjustRooms);
router.get('/:planId/adjustments', controlPlanController.getAdjustments);
router.get('/check/expired', controlPlanController.checkExpiredPlans);

module.exports = router;
