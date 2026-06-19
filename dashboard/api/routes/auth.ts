import { Router } from 'express'
import { authController } from '../controllers/AuthController.js'
import { authMiddleware, roleMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/login', (req, res) => authController.login(req, res))
router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res))
router.get('/me', authMiddleware, (req, res) => authController.getCurrentUser(req, res))
router.put('/password', authMiddleware, (req, res) => authController.changePassword(req, res))
router.get('/accounts', authMiddleware, roleMiddleware('admin'), (req, res) => authController.listAccounts(req, res))

export default router
