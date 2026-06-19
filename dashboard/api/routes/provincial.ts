import { Router } from 'express'
import { provincialController } from '../controllers/ProvincialController.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/sync', authMiddleware, roleMiddleware('admin'), (req, res) => provincialController.syncToProvincial(req, res))
router.get('/settlements', authMiddleware, (req, res) => provincialController.getProvincialSettlements(req, res))
router.get('/settlements/stats', authMiddleware, (req, res) => provincialController.getProvincialStats(req, res))
router.get('/settlements/cross-city', authMiddleware, (req, res) => provincialController.getCrossCitySettlements(req, res))
router.get('/settlements/:batchId', authMiddleware, (req, res) => provincialController.getProvincialSettlementDetail(req, res))
router.get('/settlements/:batchId/details', authMiddleware, (req, res) => provincialController.getSettlementDetails(req, res))
router.get('/settlements/:batchId/status', authMiddleware, (req, res) => provincialController.checkSyncStatus(req, res))
router.post('/settlements/:batchId/confirm', authMiddleware, roleMiddleware('admin'), (req, res) => provincialController.confirmReceipt(req, res))
router.post('/settlements', authMiddleware, roleMiddleware('admin'), (req, res) => provincialController.createSettlementRecord(req, res))
router.get('/connection/test', authMiddleware, roleMiddleware('admin'), (req, res) => provincialController.testConnection(req, res))
router.get('/config', authMiddleware, roleMiddleware('admin'), (req, res) => provincialController.getConfig(req, res))
router.put('/config', authMiddleware, roleMiddleware('admin'), (req, res) => provincialController.updateConfig(req, res))
router.get('/report', authMiddleware, (req, res) => provincialController.generateProvincialReport(req, res))

export default router
