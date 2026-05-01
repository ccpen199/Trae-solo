import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.post('/login', UserController.login)
router.post('/register', UserController.register)
router.get('/me', authMiddleware, UserController.getCurrentUser)
router.put('/profile', authMiddleware, UserController.updateProfile)
router.put('/password', authMiddleware, UserController.changePassword)

export default router
