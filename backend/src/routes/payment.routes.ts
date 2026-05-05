import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import paymentService from '../services/payment.service';
import { body, query, validationResult } from 'express-validator';

const router = Router();

router.get(
  '/info',
  authenticateToken,
  [query('orderAmount').isFloat({ gt: 0 }).withMessage('订单金额必须大于0')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const orderAmount = parseFloat(req.query.orderAmount as string);

      const result = await paymentService.getPaymentInfo(userId, orderAmount);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

router.post(
  '/execute',
  authenticateToken,
  [
    body('orderAmount').isFloat({ gt: 0 }).withMessage('订单金额必须大于0'),
    body('useFundShare').isBoolean().withMessage('useFundShare必须是布尔值'),
    body('useAccountBalance').isBoolean().withMessage('useAccountBalance必须是布尔值'),
    body('paymentPassword').notEmpty().withMessage('支付密码不能为空'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.body.useFundShare && !req.body.useAccountBalance) {
        return res.status(400).json({
          success: false,
          error: '至少选择一种支付方式',
        });
      }

      const userId = req.userId!;
      const result = await paymentService.executePayment({
        userId,
        orderAmount: parseFloat(req.body.orderAmount),
        useFundShare: req.body.useFundShare,
        useAccountBalance: req.body.useAccountBalance,
        paymentPassword: req.body.paymentPassword,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

router.post(
  '/refund',
  authenticateToken,
  [
    body('originalOrderNo').notEmpty().withMessage('原订单号不能为空'),
    body('refundAmount').isFloat({ gt: 0 }).withMessage('退款金额必须大于0'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const result = await paymentService.refund(
        userId,
        req.body.originalOrderNo,
        parseFloat(req.body.refundAmount)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
