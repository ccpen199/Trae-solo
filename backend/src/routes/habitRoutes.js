const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getHabits, createHabit, updateHabit, deleteHabit, checkInHabit, getHabitRecords, updateSortOrder } = require('../controllers/habitController');

router.get('/', authenticateToken, getHabits);
router.post('/', authenticateToken, createHabit);
router.put('/:id', authenticateToken, updateHabit);
router.delete('/:id', authenticateToken, deleteHabit);
router.post('/:id/checkin', authenticateToken, checkInHabit);
router.get('/:id/records', authenticateToken, getHabitRecords);
router.put('/sort/order', authenticateToken, updateSortOrder);

module.exports = router;