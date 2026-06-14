import { Router } from 'express'
import { getUpcomingSessions, reserveSession, getMyReservations } from '../controllers/liveController.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/upcoming', getUpcomingSessions)
router.post('/sessions/:id/reserve', auth, reserveSession)
router.get('/reservations', auth, getMyReservations)

export default router
