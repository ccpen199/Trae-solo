import { Router } from 'express'
import paymentController from '../controllers/PaymentController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/orders', authMiddleware, paymentController.listOrders.bind(paymentController))
router.post('/create-order', authMiddleware, paymentController.createOrder.bind(paymentController))
router.post('/:id/pay', authMiddleware, paymentController.payOrder.bind(paymentController))
router.get('/:id/status', authMiddleware, paymentController.getStatus.bind(paymentController))

export default router
