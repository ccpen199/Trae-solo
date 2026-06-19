import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { success, error } from '../utils/response';
import {
  createWithdrawal,
  getWithdrawalList,
  getWithdrawalDetail,
} from '../services/withdrawalService';

const router = Router();

router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { amount, channel } = req.body;
    const result = createWithdrawal((req as any).user.id, amount, channel);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = getWithdrawalList((req as any).user.id, page, pageSize);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = getWithdrawalDetail(id, (req as any).user.id);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

export default router;
