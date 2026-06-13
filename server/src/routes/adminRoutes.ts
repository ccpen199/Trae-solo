import { Router } from 'express'
import { 
  getDashboardStats, 
  getIndustryTrends, 
  getSkillGaps, 
  getProviderStats,
  getDisputes,
  resolveDispute,
} from '../controllers/adminController'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats)
router.get('/industry-trends', getIndustryTrends)
router.get('/skill-gaps', getSkillGaps)
router.get('/providers/:providerId', getProviderStats)
router.get('/disputes', authMiddleware, adminMiddleware, getDisputes)
router.post('/disputes/:id/resolve', authMiddleware, adminMiddleware, resolveDispute)

export default router
