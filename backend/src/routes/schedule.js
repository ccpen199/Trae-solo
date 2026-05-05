const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/my', scheduleController.getMySchedules);
router.get('/department', scheduleController.getDepartmentSchedules);
router.get('/search', scheduleController.searchSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;
