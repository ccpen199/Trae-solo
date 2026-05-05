const express = require('express');
const router = express.Router();
const timeSlotController = require('../controllers/timeSlotController');
const { authenticateToken, isManager } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', timeSlotController.getTimeSlots);
router.get('/:id', timeSlotController.getTimeSlotById);
router.post('/', isManager, timeSlotController.createTimeSlot);
router.put('/:id', isManager, timeSlotController.updateTimeSlot);
router.delete('/:id', isManager, timeSlotController.deleteTimeSlot);
router.put('/:id/toggle-status', isManager, timeSlotController.toggleTimeSlotStatus);

module.exports = router;
