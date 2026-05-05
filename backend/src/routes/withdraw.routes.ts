import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import withdrawService from '../services/withdraw.service';
import { body, validationResult } from 'express-validator';

const router = Router();

router.post(
  '/normal',
  authenticateToken,
  [
    body('amount').isFloat({ gt: 0 }).withMessage('提现金额必须大于0'),
    body('source').isIn(['BALANCE', 'FUND']).withMessage('资金来源不正确'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const result = await withdrawService.normalWithdraw({
        userId,
        amount: parseFloat(req.body.amount),
        source: req.body.source,
        bankCardId: req.body.bankCardId || 'default',
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
  '/normal-redeem',
  authenticateToken,
  [body('amount').isFloat({ gt: 0 }).withMessage('提现金额必须大于0')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const result = await withdrawService.normalRedeemWithdraw({
        userId,
        amount: parseFloat(req.body.amount),
        bankCardId: req.body.bankCardId || 'default',
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

export default router;
