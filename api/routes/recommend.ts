import { Router } from 'express'
import { generateRecommend, analyzePlan, getProbability } from '../controllers/recommendController.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.post('/generate', auth, generateRecommend)
router.post('/analyze', auth, analyzePlan)
router.get('/probability', getProbability)

export default router
