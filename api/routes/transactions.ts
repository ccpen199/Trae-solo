import { Router, type Request, type Response } from 'express';
import * as transactionService from '../services/transactionService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const result = transactionService.listTransactions(status, page, limit);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = transactionService.getTransactionDetail(parseInt(req.params.id));
    if (!result) {
      res.status(404).json({ success: false, error: '交易不存在' });
      return;
    }
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = transactionService.createTransaction(req.body);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.put('/:id/nodes', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId, status } = req.body;
    const result = transactionService.updateNodeStatus(parseInt(req.params.id), parseInt(nodeId), status);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/:id/commission', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const tx = transactionService.getTransactionDetail(parseInt(req.params.id));
    if (!tx) {
      res.status(404).json({ success: false, error: '交易不存在' });
      return;
    }
    const commission = transactionService.calcCommission(tx.transaction.price, true);
    res.json({ success: true, commission });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
