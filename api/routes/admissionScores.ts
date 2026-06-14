import { Router } from 'express'
import { getTrend } from '../controllers/admissionScoreController.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/trend', getTrend)

export default router
