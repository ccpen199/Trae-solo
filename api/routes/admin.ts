import { Router } from 'express'
import adminController from '../controllers/AdminController.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/stats', authMiddleware, requireAdmin, adminController.stats.bind(adminController))
router.get('/dashboard', authMiddleware, requireAdmin, adminController.dashboard.bind(adminController))
router.get('/warnings', authMiddleware, requireAdmin, adminController.listWarnings.bind(adminController))
router.post('/warnings/:id/handle', authMiddleware, requireAdmin, adminController.handleWarning.bind(adminController))
router.get('/audit-rules', authMiddleware, requireAdmin, adminController.listAuditRules.bind(adminController))
router.post('/audit-rules', authMiddleware, requireAdmin, adminController.createAuditRule.bind(adminController))
router.put('/audit-rules/:id', authMiddleware, requireAdmin, adminController.updateAuditRule.bind(adminController))
router.get('/datashare/compare', authMiddleware, requireAdmin, adminController.datashareCompare.bind(adminController))

export default router
