import { Router } from 'express'
import { ExchangeController } from '../controllers/exchange.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.post('/', authMiddleware, ExchangeController.createExchange)
router.get('/', authMiddleware, ExchangeController.listOrders)
router.get('/:orderId', authMiddleware, ExchangeController.getOrder)
router.post('/:orderId/confirm', authMiddleware, ExchangeController.confirmExchange)
router.post('/:orderId/cancel', authMiddleware, ExchangeController.cancelExchange)

export default router
