import { Router } from 'express'
import {
  getSettlements,
  getSettlementById,
  createSettlement,
  processSettlement,
  getPaymentMethods,
  addPaymentMethod,
  withdraw,
} from '../controllers/settlement.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, getSettlements)
router.get('/:id', authenticate, getSettlementById)
router.post('/', authenticate, createSettlement)
router.put('/:id/process', authenticate, processSettlement)
router.get('/payment-methods', authenticate, getPaymentMethods)
router.post('/payment-methods', authenticate, addPaymentMethod)
router.post('/withdraw', authenticate, withdraw)

export { router as settlementRouter }
