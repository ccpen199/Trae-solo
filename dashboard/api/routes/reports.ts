import { Router } from 'express'
import { reportController } from '../controllers/ReportController.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/dashboard', authMiddleware, (req, res) => reportController.getDashboardStats(req, res))
router.get('/verification-trend', authMiddleware, (req, res) => reportController.getVerificationTrend(req, res))
router.get('/category-distribution', authMiddleware, (req, res) => reportController.getCategoryDistribution(req, res))
router.get('/district-distribution', authMiddleware, (req, res) => reportController.getDistrictDistribution(req, res))
router.get('/activity/:activityId/performance', authMiddleware, (req, res) => reportController.getActivityPerformance(req, res))
router.get('/merchant/:merchantId/performance', authMiddleware, (req, res) => reportController.getMerchantPerformance(req, res))
router.get('/settlement', authMiddleware, (req, res) => reportController.getSettlementReport(req, res))
router.get('/risk', authMiddleware, (req, res) => reportController.getRiskReport(req, res))
router.get('/recommendations/:userId', authMiddleware, (req, res) => reportController.getRecommendations(req, res))
router.get('/personalized/:userId', authMiddleware, (req, res) => reportController.getPersonalizedStats(req, res))
router.get('/trending', authMiddleware, (req, res) => reportController.getTrendingCoupons(req, res))
router.post('/export', authMiddleware, roleMiddleware('admin'), (req, res) => reportController.exportReport(req, res))

export default router
