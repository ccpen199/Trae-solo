import { Router, type Request, type Response } from 'express';
import * as dashboardService from '../services/dashboardService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/agent-performance', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const period = req.query.period as string || 'month';
    const result = dashboardService.getAgentPerformance(period);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/property-health', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = dashboardService.getPropertyHealth();
    res.json({ success: true, healthData: result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/supply-chain', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const suppliers = dashboardService.listSuppliers();
    res.json({ success: true, suppliers });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/supply-chain', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = dashboardService.createSupplier(req.body);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.put('/supply-chain/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = dashboardService.updateSupplier(parseInt(req.params.id), req.body);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/settings', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = dashboardService.getSettings();
    res.json({ success: true, settings });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/settings', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = dashboardService.updateSettings(req.body);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

export default router;
