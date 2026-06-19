import { Router } from 'express'
import { riskController } from '../controllers/RiskController.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req, res) => riskController.getEvents(req, res))
router.get('/stats', authMiddleware, (req, res) => riskController.getRiskStats(req, res))
router.post('/scan', authMiddleware, roleMiddleware('admin', 'risk_officer'), (req, res) => riskController.runRiskScan(req, res))
router.post('/detect/multi-account', authMiddleware, roleMiddleware('admin', 'risk_officer'), (req, res) => riskController.detectMultiAccount(req, res))
router.post('/detect/bulk-hoarding', authMiddleware, roleMiddleware('admin', 'risk_officer'), (req, res) => riskController.detectBulkHoarding(req, res))
router.post('/detect/abnormal-path', authMiddleware, roleMiddleware('admin', 'risk_officer'), (req, res) => riskController.detectAbnormalPath(req, res))
router.get('/:id', authMiddleware, (req, res) => riskController.getEventDetail(req, res))
router.post('/:id/resolve', authMiddleware, roleMiddleware('admin', 'risk_officer'), (req, res) => riskController.resolveEvent(req, res))
router.patch('/:id/status', authMiddleware, roleMiddleware('admin', 'risk_officer'), (req, res) => riskController.updateEventStatus(req, res))
router.post('/', authMiddleware, roleMiddleware('admin', 'risk_officer'), (req, res) => riskController.createManualEvent(req, res))

export default router
