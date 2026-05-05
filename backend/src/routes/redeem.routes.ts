import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import redeemService from '../services/redeem.service';
import { body, validationResult } from 'express-validator';

const router = Router();

router.get('/limit-info', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const result = await redeemService.getRedeemLimitInfo(userId);

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
});

router.post(
  '/instant',
  authenticateToken,
  [body('amount').isFloat({ gt: 0 }).withMessage('赎回金额必须大于0')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const result = await redeemService.instantRedeem({
        userId,
        amount: parseFloat(req.body.amount),
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
  '/normal',
  authenticateToken,
  [body('amount').isFloat({ gt: 0 }).withMessage('赎回金额必须大于0')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const result = await redeemService.normalRedeem({
        userId,
        amount: parseFloat(req.body.amount),
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
