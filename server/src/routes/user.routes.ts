import { Router } from 'express'
import {
  getAnnotators,
  getUserById,
  updateUser,
  getUserStats,
  getSkills,
  certifySkill,
} from '../controllers/user.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/annotators', authenticate, getAnnotators)
router.get('/stats', authenticate, getUserStats)
router.get('/skills', authenticate, getSkills)
router.get('/:id', authenticate, getUserById)
router.put('/:id', authenticate, updateUser)
router.post('/skills/:skillId/certify', authenticate, certifySkill)

export { router as userRouter }
