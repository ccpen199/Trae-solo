import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import reportService from '../services/report.service';

const router = Router();

router.get('/overview', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await reportService.getOverviewStats();

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

router.get('/daily-stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const result = await reportService.getDailyStats(days);

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

router.get('/failed-orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await reportService.getFailedOrders(page, pageSize);

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

router.get('/dplan-stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await reportService.getDPlanStats();

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

export default router;
