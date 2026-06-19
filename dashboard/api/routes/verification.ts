import { Router } from 'express'
import { verificationController } from '../controllers/VerificationController.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/verify', authMiddleware, (req, res) => verificationController.verify(req, res))
router.post('/:id/reverse', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => verificationController.reverse(req, res))
router.get('/', authMiddleware, (req, res) => verificationController.getRecords(req, res))
router.get('/trend', authMiddleware, (req, res) => verificationController.getVerificationTrend(req, res))
router.get('/today', authMiddleware, (req, res) => verificationController.getTodayStats(req, res))
router.get('/reconciliation', authMiddleware, (req, res) => verificationController.getReconciliationData(req, res))
router.get('/:id', authMiddleware, (req, res) => verificationController.getRecordDetail(req, res))

router.post('/settlement', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => verificationController.submitSettlement(req, res))
router.get('/settlement/list', authMiddleware, (req, res) => verificationController.getSettlementList(req, res))
router.get('/settlement/stats', authMiddleware, (req, res) => verificationController.getReconciliationStats(req, res))
router.get('/settlement/summary', authMiddleware, (req, res) => verificationController.getSettlementSummary(req, res))
router.get('/settlement/:id', authMiddleware, (req, res) => verificationController.getSettlementDetail(req, res))
router.post('/settlement/:id/approve', authMiddleware, roleMiddleware('admin'), (req, res) => verificationController.approveSettlement(req, res))
router.post('/settlement/:id/reject', authMiddleware, roleMiddleware('admin'), (req, res) => verificationController.rejectSettlement(req, res))
router.get('/merchants/:merchantId', authMiddleware, (req, res) => verificationController.getMerchantStats(req, res))

export default router
