import { Router, type Request, type Response } from 'express';
import * as workOrderService from '../services/workOrderService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      type: req.query.type as string,
      status: req.query.status as string,
      propertyId: req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined,
    };
    const result = workOrderService.listWorkOrders(filters, page, limit);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = workOrderService.getWorkOrderDetail(parseInt(req.params.id));
    if (!result) {
      res.status(404).json({ success: false, error: '工单不存在' });
      return;
    }
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = workOrderService.createWorkOrder({ ...req.body, reporterId: userId });
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.put('/:id/assign', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId } = req.body;
    const result = workOrderService.assignWorkOrder(parseInt(req.params.id), parseInt(agentId), req.user!.id);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.put('/:id/start', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = workOrderService.startWorkOrder(parseInt(req.params.id), req.user!.id);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.put('/:id/complete', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { result } = req.body;
    const r = workOrderService.completeWorkOrder(parseInt(req.params.id), result, req.user!.id);
    res.json({ success: true, ...r });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

export default router;
