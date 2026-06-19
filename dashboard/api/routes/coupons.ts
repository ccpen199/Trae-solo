import { Router } from 'express'
import { couponController } from '../controllers/CouponController.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/activities', authMiddleware, roleMiddleware('admin'), (req, res) => couponController.createActivity(req, res))
router.get('/activities', authMiddleware, (req, res) => couponController.getActivityList(req, res))
router.get('/activities/:id', authMiddleware, (req, res) => couponController.getActivityDetail(req, res))
router.put('/activities/:id', authMiddleware, roleMiddleware('admin'), (req, res) => couponController.updateActivity(req, res))
router.patch('/activities/:id/status', authMiddleware, roleMiddleware('admin'), (req, res) => couponController.updateActivityStatus(req, res))
router.post('/distribute', authMiddleware, roleMiddleware('admin'), (req, res) => couponController.distributeCoupon(req, res))
router.post('/batch-distribute', authMiddleware, roleMiddleware('admin'), (req, res) => couponController.batchDistribute(req, res))
router.get('/users/:userId', authMiddleware, (req, res) => couponController.getUserCoupons(req, res))
router.get('/instances/:id', authMiddleware, (req, res) => couponController.getInstanceDetail(req, res))
router.get('/inventory/:activityId', authMiddleware, (req, res) => couponController.getInventoryCount(req, res))
router.post('/expire', authMiddleware, roleMiddleware('admin'), (req, res) => couponController.expireCoupons(req, res))

export default router
