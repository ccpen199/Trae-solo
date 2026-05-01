import { Router } from 'express'
import { RuleController } from '../controllers/rule.controller'
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware'
import { UserRole } from '../entities'

const router = Router()

router.get('/', authMiddleware, RuleController.listRules)
router.get('/:ruleId', authMiddleware, RuleController.getRule)
router.post('/', authMiddleware, roleMiddleware(UserRole.MANAGER, UserRole.ADMIN), RuleController.createRule)
router.put('/:ruleId', authMiddleware, roleMiddleware(UserRole.MANAGER, UserRole.ADMIN), RuleController.updateRule)
router.post('/:ruleId/activate', authMiddleware, roleMiddleware(UserRole.MANAGER, UserRole.ADMIN), RuleController.activateRule)
router.post('/:ruleId/deactivate', authMiddleware, roleMiddleware(UserRole.MANAGER, UserRole.ADMIN), RuleController.deactivateRule)
router.delete('/:ruleId', authMiddleware, roleMiddleware(UserRole.ADMIN), RuleController.deleteRule)

export default router
