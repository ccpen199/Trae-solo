import { Router } from 'express'
import { PointsController } from '../controllers/points.controller'
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware'
import { UserRole } from '../entities'

const router = Router()

router.get('/info', authMiddleware, PointsController.getPointsInfo)
router.get('/transactions', authMiddleware, PointsController.getTransactions)
router.post('/award', authMiddleware, roleMiddleware(UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.ADMIN), PointsController.awardPoints)
router.post('/trigger-event', authMiddleware, PointsController.triggerEvent)
router.post('/check-in', authMiddleware, PointsController.checkIn)

export default router
