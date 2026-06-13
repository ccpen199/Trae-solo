import { Router } from 'express'
import { createBid, getBidsByTask, getMyBids, withdrawBid } from '../controllers/bidController'
import { authMiddleware, providerMiddleware } from '../middleware/auth'

const router = Router()

router.get('/my', authMiddleware, getMyBids)
router.get('/task/:taskId', getBidsByTask)
router.post('/', authMiddleware, providerMiddleware, createBid)
router.post('/:id/withdraw', authMiddleware, withdrawBid)

export default router
