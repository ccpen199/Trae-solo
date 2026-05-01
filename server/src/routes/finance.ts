import { Router, Request, Response } from 'express';
import { financeService } from '../services/financeService';
import { auditService } from '../services/auditService';
import { authMiddleware, AuthenticatedRequest } from '../middleware';
import { UserRole, AuditAction } from '../types';

const router = Router();

router.get('/budgets', authMiddleware([UserRole.ADMIN, UserRole.FINANCE, UserRole.OPERATOR, UserRole.MERCHANT]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, ownerId, page, limit } = req.query;
    
    const result = await financeService.listBudgets({
      status: status as string,
      ownerId: ownerId as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/budgets/:budgetId', authMiddleware([UserRole.ADMIN, UserRole.FINANCE, UserRole.OPERATOR]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { budgetId } = req.params;
    
    const budget = await financeService.getBudgetById(budgetId);
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }
    
    res.json({
      success: true,
      budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/budgets/:budgetId/report', authMiddleware([UserRole.ADMIN, UserRole.FINANCE]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { budgetId } = req.params;
    
    const report = await financeService.getBudgetReport(budgetId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Budget report not found'
      });
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/subsidy-summary', authMiddleware([UserRole.ADMIN, UserRole.FINANCE, UserRole.OPERATOR]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, storeId, status } = req.query;
    
    const result = await financeService.calculateSubsidyAmount({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      storeId: storeId as string,
      status: status as string
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/export', authMiddleware([UserRole.ADMIN, UserRole.FINANCE]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format, startDate, endDate, budgetIds, storeIds, includeTemplates, includeOrders, includeAuditTrail } = req.body;
    
    const result = await financeService.exportReconciliationReport(
      {
        format: format || 'excel',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        budgetIds,
        storeIds,
        includeTemplates: includeTemplates !== false,
        includeOrders: includeOrders !== false,
        includeAuditTrail: includeAuditTrail === true
      },
      req.user!.id,
      req.traceId
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    if (format === 'json' || result.data) {
      res.json({
        success: true,
        filename: result.filename,
        data: result.data
      });
      return;
    }
    
    if (result.buffer) {
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
      return;
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/audit-logs', authMiddleware([UserRole.ADMIN, UserRole.FINANCE]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, action, resourceType, resourceId, traceId, startDate, endDate, page, limit } = req.query;
    
    const result = await auditService.getAuditLogs({
      userId: userId as string,
      action: action as AuditAction,
      resourceType: resourceType as string,
      resourceId: resourceId as string,
      traceId: traceId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/audit-logs/coupon/:couponId', authMiddleware([UserRole.ADMIN, UserRole.FINANCE, UserRole.OPERATOR]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { couponId } = req.params;
    
    const logs = await auditService.getCouponAuditTrail(couponId);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/audit-logs/trace/:traceId', authMiddleware([UserRole.ADMIN, UserRole.FINANCE]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { traceId } = req.params;
    
    const logs = await auditService.getTraceLogs(traceId);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/user-activity/:userId', authMiddleware([UserRole.ADMIN, UserRole.FINANCE]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;
    
    const result = await auditService.getUserActivity(
      userId,
      days ? parseInt(days as string, 10) : 30
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
