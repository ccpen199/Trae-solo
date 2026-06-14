import { Router } from 'express'
import familyController from '../controllers/FamilyController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/members', authMiddleware, familyController.listMembers.bind(familyController))
router.post('/bind', authMiddleware, familyController.bind.bind(familyController))
router.post('/verify-police', authMiddleware, familyController.verifyPolice.bind(familyController))
router.get('/usage-records', authMiddleware, familyController.usageRecords.bind(familyController))
router.post('/:id/authorize', authMiddleware, familyController.authorize.bind(familyController))
router.post('/:id/unbind', authMiddleware, familyController.unbind.bind(familyController))

export default router
