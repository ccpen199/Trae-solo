import { Router } from 'express'
import { 
  getDashboardStats, 
  getIndustryTrends, 
  getSkillGaps, 
  getProviderStats,
  getDisputes,
  resolveDispute,
  getDisputeDetail,
  submitVerdict,
  getProvidersList,
  adjustProviderLevel,
} from '../controllers/adminController'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats)
router.get('/industry-trends', getIndustryTrends)
router.get('/skill-gaps', getSkillGaps)
router.get('/providers', authMiddleware, adminMiddleware, getProvidersList)
router.get('/providers/:providerId', getProviderStats)
router.post('/providers/:providerId/adjust-level', authMiddleware, adminMiddleware, adjustProviderLevel)
router.get('/disputes', authMiddleware, adminMiddleware, getDisputes)
router.get('/disputes/:id', authMiddleware, adminMiddleware, getDisputeDetail)
router.post('/disputes/:id/resolve', authMiddleware, adminMiddleware, resolveDispute)
router.post('/disputes/:id/verdict', authMiddleware, adminMiddleware, submitVerdict)

export default router
