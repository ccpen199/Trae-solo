import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { reportService } from '../services/report-service';
import { UserPayload, requireRole } from '../middleware/auth';

const router = Router();

router.get(
  '/dashboard',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const summary = await reportService.getDashboardSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Get dashboard summary error:', error);
      res.status(500).json({
        success: false,
        error: '获取仪表盘数据失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/daily-visits',
  requireRole('ADMIN', 'DOCTOR'),
  [
    query('startDate').notEmpty().withMessage('开始日期不能为空').isISO8601().withMessage('开始日期格式无效'),
    query('endDate').notEmpty().withMessage('结束日期不能为空').isISO8601().withMessage('结束日期格式无效'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const stats = await reportService.getDailyVisitStats(startDate, endDate);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get daily visit stats error:', error);
      res.status(500).json({
        success: false,
        error: '获取每日就诊统计失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/departments',
  requireRole('ADMIN', 'DOCTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await reportService.getDepartmentStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get department stats error:', error);
      res.status(500).json({
        success: false,
        error: '获取科室统计失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/doctors',
  requireRole('ADMIN', 'DOCTOR'),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const performance = await reportService.getDoctorPerformance(startDate, endDate);

      res.json({
        success: true,
        data: performance,
      });
    } catch (error: any) {
      console.error('Get doctor performance error:', error);
      res.status(500).json({
        success: false,
        error: '获取医生绩效统计失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/prescriptions',
  requireRole('ADMIN', 'DOCTOR', 'PHARMACIST'),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await reportService.getPrescriptionStats(startDate, endDate);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get prescription stats error:', error);
      res.status(500).json({
        success: false,
        error: '获取处方统计失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/lab',
  requireRole('ADMIN', 'DOCTOR', 'NURSE'),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await reportService.getLabStats(startDate, endDate);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get lab stats error:', error);
      res.status(500).json({
        success: false,
        error: '获取检查统计失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/audit',
  requireRole('ADMIN'),
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const summary = await reportService.getAuditSummary(startDate, endDate);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Get audit summary error:', error);
      res.status(500).json({
        success: false,
        error: '获取审计摘要失败',
        message: error.message,
      });
    }
  }
);

export default router;
