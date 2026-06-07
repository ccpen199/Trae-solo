import { Router, type Request, type Response } from 'express';
import * as leaseService from '../services/leaseService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const result = leaseService.listLeases(status, page, limit);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = leaseService.getLeaseDetail(parseInt(req.params.id));
    if (!result) {
      res.status(404).json({ success: false, error: '租约不存在' });
      return;
    }
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id/payments', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = leaseService.getLeaseDetail(parseInt(req.params.id));
    if (!result) {
      res.status(404).json({ success: false, error: '租约不存在' });
      return;
    }
    res.json({ success: true, payments: result.payments });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = leaseService.createLease(req.body);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = leaseService.updateLease(parseInt(req.params.id), req.body);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/terminate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    const result = leaseService.terminateLease(parseInt(req.params.id), reason);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/payments/deduct', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = leaseService.deductPayment(parseInt(req.params.id));
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

export default router;
