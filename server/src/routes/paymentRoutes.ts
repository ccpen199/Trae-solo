import { Router } from 'express'
import { createEscrow, releasePayment, getPayments, getWallet } from '../controllers/paymentController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/wallet', authMiddleware, getWallet)
router.get('/transactions', authMiddleware, getPayments)
router.post('/escrow', authMiddleware, createEscrow)
router.post('/release', authMiddleware, releasePayment)

export default router
