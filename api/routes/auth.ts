import { Router } from 'express'
import authController from '../controllers/AuthController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/login', authController.login.bind(authController))
router.get('/profile', authMiddleware, authController.profile.bind(authController))
router.get('/me', authMiddleware, authController.profile.bind(authController))

export default router
