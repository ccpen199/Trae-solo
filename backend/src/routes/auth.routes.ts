import { Router } from 'express'
import { login, register, getCurrentUser, changePassword } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.post('/login', login)
router.post('/register', register)
router.get('/me', authMiddleware, getCurrentUser)
router.post('/change-password', authMiddleware, changePassword)

export default router
