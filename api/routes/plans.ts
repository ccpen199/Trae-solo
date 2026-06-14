import { Router } from 'express'
import { getPlans, createPlan, getPlanById, updatePlan, deletePlan, analyzePlanRisk, exportPlan } from '../controllers/volunteerPlanController.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, getPlans)
router.post('/', auth, createPlan)
router.get('/:id', auth, getPlanById)
router.put('/:id', auth, updatePlan)
router.delete('/:id', auth, deletePlan)
router.post('/:id/analyze', auth, analyzePlanRisk)
router.get('/:id/export', auth, exportPlan)

export default router
