import { Router } from 'express'
import benefitController from '../controllers/BenefitController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/pension', authMiddleware, benefitController.pensionList.bind(benefitController))
router.get('/pension-stats', authMiddleware, benefitController.pensionStats.bind(benefitController))
router.get('/medical', authMiddleware, benefitController.medicalList.bind(benefitController))
router.get('/medical-balance', authMiddleware, benefitController.medicalBalance.bind(benefitController))

export default router
