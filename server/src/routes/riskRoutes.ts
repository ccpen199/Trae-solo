import { Router } from 'express'
import { 
  checkFraud, 
  checkOriginality, 
  createComplaint, 
  createDispute, 
  getDispute, 
  uploadDisputeEvidence,
  getRiskReports,
} from '../controllers/riskController'
import { authMiddleware } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()

router.get('/reports', authMiddleware, getRiskReports)
router.get('/task/:taskId/fraud', checkFraud)
router.post('/originality', authMiddleware, checkOriginality)
router.post('/complaints', authMiddleware, createComplaint)
router.post('/disputes', authMiddleware, createDispute)
router.get('/disputes/:id', getDispute)
router.post('/disputes/evidence', authMiddleware, upload.single('file'), uploadDisputeEvidence)

export default router
