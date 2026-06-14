import { Router } from 'express'
import insuranceController from '../controllers/InsuranceController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, insuranceController.list.bind(insuranceController))
router.get('/:id/history', authMiddleware, insuranceController.history.bind(insuranceController))

export default router
