import { Router } from 'express'
import { createBid, getBidsByTask, getMyBids, getBidById, withdrawBid } from '../controllers/bidController'
import { authMiddleware, providerMiddleware } from '../middleware/auth'

const router = Router()

router.get('/my', authMiddleware, getMyBids)
router.get('/:id', authMiddleware, getBidById)
router.get('/task/:taskId', getBidsByTask)
router.post('/', authMiddleware, providerMiddleware, createBid)
router.post('/:id/withdraw', authMiddleware, withdrawBid)

export default router
