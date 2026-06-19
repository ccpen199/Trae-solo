import { Router } from 'express'
import {
  getOverview,
  getProductivityData,
  getAnnotatorAnalytics,
  getROIAnalysis,
  getQualityAnalytics,
  getForecast,
} from '../controllers/analytics.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/overview', authenticate, getOverview)
router.get('/productivity', authenticate, getProductivityData)
router.get('/annotators', authenticate, getAnnotatorAnalytics)
router.get('/roi', authenticate, getROIAnalysis)
router.get('/quality', authenticate, getQualityAnalytics)
router.get('/forecast', authenticate, getForecast)

export { router as analyticsRouter }
