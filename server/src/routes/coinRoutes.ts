import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { success, error } from '../utils/response';
import {
  getCoinRecords,
  exchangeCoinsToCash,
  getExchangeRate,
} from '../services/coinService';

const router = Router();

router.get('/records', authMiddleware, (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = getCoinRecords((req as any).user.id, page, pageSize);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/exchange-rate', (req: Request, res: Response) => {
  try {
    const rate = getExchangeRate();
    res.json(success(rate));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/exchange', authMiddleware, (req: Request, res: Response) => {
  try {
    const { coinAmount } = req.body;
    const result = exchangeCoinsToCash((req as any).user.id, coinAmount);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

export default router;
