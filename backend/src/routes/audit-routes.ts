import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { auditEngine } from '../engines/audit-engine';
import { UserPayload, requireRole } from '../middleware/auth';

const router = Router();

router.get(
  '/logs',
  requireRole('ADMIN', 'DOCTOR'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit必须在1-100之间'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset必须大于等于0'),
    query('action').optional().isString().withMessage('action必须是字符串'),
    query('module').optional().isString().withMessage('module必须是字符串'),
    query('userId').optional().isString().withMessage('userId必须是字符串'),
    query('startDate').optional().isISO8601().withMessage('startDate必须是有效的日期格式'),
    query('endDate').optional().isISO8601().withMessage('endDate必须是有效的日期格式'),
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

      const user = req.user as UserPayload;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const action = req.query.action as string | undefined;
      const module = req.query.module as string | undefined;
      const filterUserId = req.query.userId as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const filters: any = {};
      if (action) filters.action = action;
      if (module) filters.module = module;
      if (filterUserId) filters.userId = filterUserId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await auditEngine.queryLogs(filters, { limit, offset });

      res.json({
        success: true,
        data: {
          logs: result.logs,
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        error: '获取审计日志失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/logs/:logId',
  requireRole('ADMIN', 'DOCTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { logId } = req.params;

      const log = await auditEngine.getLogById(logId);

      if (!log) {
        res.status(404).json({
          success: false,
          error: '审计日志不存在',
          code: 'LOG_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        data: log,
      });
    } catch (error: any) {
      console.error('Get audit log error:', error);
      res.status(500).json({
        success: false,
        error: '获取审计日志详情失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/entity/:entityType/:entityId',
  requireRole('ADMIN', 'DOCTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { entityType, entityId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const history = await auditEngine.getEntityHistory(entityType, entityId, limit);

      res.json({
        success: true,
        data: {
          entityType,
          entityId,
          history,
          count: history.length,
        },
      });
    } catch (error: any) {
      console.error('Get entity history error:', error);
      res.status(500).json({
        success: false,
        error: '获取实体变更历史失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/statistics',
  requireRole('ADMIN'),
  [
    query('startDate').optional().isISO8601().withMessage('startDate必须是有效的日期格式'),
    query('endDate').optional().isISO8601().withMessage('endDate必须是有效的日期格式'),
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

      const stats = await auditEngine.getStatistics(startDate, endDate);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get audit statistics error:', error);
      res.status(500).json({
        success: false,
        error: '获取审计统计失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/export',
  requireRole('ADMIN'),
  [
    query('startDate').optional().isISO8601().withMessage('startDate必须是有效的日期格式'),
    query('endDate').optional().isISO8601().withMessage('endDate必须是有效的日期格式'),
    query('format').optional().isIn(['csv', 'json']).withMessage('format必须是csv或json'),
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

      const user = req.user as UserPayload;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const format = (req.query.format as string) || 'csv';

      if (format === 'csv') {
        const options: any = {};
        if (startDate) options.startDate = startDate;
        if (endDate) options.endDate = endDate;
        const csvContent = await auditEngine.exportToCSV(options);
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.csv`);
        res.send('\uFEFF' + csvContent);
      } else {
        const filters: any = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        
        const result = await auditEngine.queryLogs(filters, { limit: 10000, offset: 0 });
        
        res.json({
          success: true,
          data: result.logs,
          total: result.total,
        });
      }
    } catch (error: any) {
      console.error('Export audit logs error:', error);
      res.status(500).json({
        success: false,
        error: '导出审计日志失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/cdss-alerts',
  requireRole('ADMIN', 'DOCTOR'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit必须在1-100之间'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset必须大于等于0'),
    query('status').optional().isIn(['PENDING', 'OVERRIDE', 'ACCEPTED']).withMessage('状态无效'),
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

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const status = req.query.status as string | undefined;

      const filters: any = {};
      if (status) filters.status = status;

      const result = await auditEngine.queryCDSSAlerts(filters, { limit, offset });

      res.json({
        success: true,
        data: {
          alerts: result.alerts,
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      console.error('Get CDSS alerts error:', error);
      res.status(500).json({
        success: false,
        error: '获取CDSS告警失败',
        message: error.message,
      });
    }
  }
);

export default router;
