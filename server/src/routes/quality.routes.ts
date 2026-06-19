import { Router } from 'express'
import {
  getConsistencyResults,
  getAdversarialStats,
  getDisputes,
  createDispute,
  resolveDispute,
  getSamplingTasks,
  updateQualityConfig,
} from '../controllers/quality.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/consistency', authenticate, getConsistencyResults)
router.get('/adversarial', authenticate, getAdversarialStats)
router.get('/disputes', authenticate, getDisputes)
router.post('/disputes', authenticate, createDispute)
router.put('/disputes/:id/resolve', authenticate, resolveDispute)
router.get('/sampling', authenticate, getSamplingTasks)
router.put('/config', authenticate, updateQualityConfig)

export { router as qualityRouter }
