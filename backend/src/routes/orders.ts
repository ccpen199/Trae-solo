import { Router } from 'express';
import { body, param, query } from 'express-validator';
import orderController from '../controllers/OrderController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/calculate-price', orderController.calculatePrice);

router.get('/statistics', authenticate, orderController.getOrderStatistics);

router.get('/', authenticate, orderController.getOrders);

router.get('/:id', authenticate, orderController.getOrder);

router.post(
  '/',
  authenticate,
  [
    body('propertyId').notEmpty().withMessage('房源ID不能为空'),
    body('checkInDate').isDate().withMessage('入住日期格式不正确'),
    body('checkOutDate').isDate().withMessage('退房日期格式不正确'),
    body('guestCount').isInt({ min: 1 }).withMessage('入住人数至少为1'),
    body('requestId').notEmpty().withMessage('请求ID不能为空（用于防止重复提交）'),
  ],
  orderController.createOrder
);

router.post(
  '/:id/confirm',
  authenticate,
  [
    param('id').notEmpty().withMessage('订单ID不能为空'),
  ],
  orderController.confirmOrder
);

router.post(
  '/:id/cancel',
  authenticate,
  [
    param('id').notEmpty().withMessage('订单ID不能为空'),
    body('reason').notEmpty().withMessage('取消原因不能为空'),
  ],
  orderController.cancelOrder
);

router.post(
  '/:id/check-in',
  authenticate,
  [
    param('id').notEmpty().withMessage('订单ID不能为空'),
  ],
  orderController.checkIn
);

router.post(
  '/:id/check-out',
  authenticate,
  [
    param('id').notEmpty().withMessage('订单ID不能为空'),
  ],
  orderController.checkOut
);

router.post(
  '/:id/refund',
  authenticate,
  [
    param('id').notEmpty().withMessage('订单ID不能为空'),
    body('amount').isFloat({ min: 0 }).withMessage('退款金额必须大于等于0'),
    body('reason').notEmpty().withMessage('退款原因不能为空'),
  ],
  orderController.processRefund
);

export default router;
