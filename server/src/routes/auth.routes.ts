import { Router } from 'express'
import { login, register, getCurrentUser, changeRole } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.post('/login', login)
router.post('/register', register)
router.get('/me', authenticate, getCurrentUser)
router.post('/role', authenticate, changeRole)

export { router as authRouter }
