import { Router } from 'express'
import { getStatistics, getHeatmap, approveQuestion, rejectQuestion, desensitizeData } from '../controllers/adminController.js'
import { auth, requireRoles } from '../middleware/auth.js'

const router = Router()

router.use(auth, requireRoles(['admin']))

router.get('/statistics', getStatistics)
router.get('/heatmap', getHeatmap)
router.put('/questions/:id/approve', approveQuestion)
router.put('/questions/:id/reject', rejectQuestion)
router.post('/desensitize', desensitizeData)

export default router
