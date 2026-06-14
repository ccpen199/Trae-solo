import { Router } from 'express'
import authController from '../controllers/AuthController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/profile', authMiddleware, authController.profile.bind(authController))

export default router
