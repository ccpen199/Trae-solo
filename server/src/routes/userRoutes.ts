import { Router } from 'express'
import { register, login, getCurrentUser, updateProfile, getUserById, updateUserSkills } from '../controllers/userController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authMiddleware, getCurrentUser)
router.put('/me', authMiddleware, updateProfile)
router.put('/me/skills', authMiddleware, updateUserSkills)
router.get('/:id', getUserById)

export default router
