import { Router } from 'express'
import { ReconciliationController } from '../controllers/reconciliation.controller'
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware'
import { UserRole } from '../entities'

const router = Router()

router.get('/', authMiddleware, roleMiddleware(UserRole.FINANCE, UserRole.MANAGER, UserRole.ADMIN), ReconciliationController.listReconciliations)
router.get('/by-date', authMiddleware, roleMiddleware(UserRole.FINANCE, UserRole.MANAGER, UserRole.ADMIN), ReconciliationController.getReconciliation)
router.post('/execute', authMiddleware, roleMiddleware(UserRole.FINANCE, UserRole.ADMIN), ReconciliationController.executeReconciliation)

export default router
