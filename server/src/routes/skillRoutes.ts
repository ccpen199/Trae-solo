import { Router } from 'express'
import { getAllSkills, createSkill, getSkillCategories } from '../controllers/skillController'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', getAllSkills)
router.get('/categories', getSkillCategories)
router.post('/', authMiddleware, adminMiddleware, createSkill)

export default router
