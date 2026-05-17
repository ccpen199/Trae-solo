const express = require('express')
const { createWorkout, getWorkoutList, getWorkoutStats } = require('../controllers/workout')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.post('/', authMiddleware, createWorkout)
router.get('/', authMiddleware, getWorkoutList)
router.get('/stats', authMiddleware, getWorkoutStats)

module.exports = router
