import { Router, type Response } from 'express';
import { authenticateToken, requirePermission, successResponse, errorResponse, type AuthRequest } from '../middleware/auth';
import { auditWorkflowService, type AuditActionData } from '../services/AuditWorkflowService';
import type { Content } from '../../shared/types';

const router = Router();

router.get('/pending',
  authenticateToken,
  requirePermission('audit:read'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        pageSize = 10,
        level,
        type,
        category,
        region,
        keyword,
      } = req.query;

      const result = await auditWorkflowService.getPendingAudits({
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        level: level ? parseInt(level as string) as 1 | 2 | 3 : undefined,
        type: type as string,
        category: category as string,
        region: region as string,
        keyword: keyword as string,
      });

      successResponse(res, result, '获取待审核列表成功');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '获取待审核列表失败');
    }
  }
);

router.get('/records',
  authenticateToken,
  requirePermission('audit:read'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        pageSize = 10,
        contentId,
        auditorId,
        level,
        action,
      } = req.query;

      const result = await auditWorkflowService.getAuditRecords({
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        contentId: contentId as string,
        auditorId: auditorId as string,
        level: level ? parseInt(level as string) as 1 | 2 | 3 : undefined,
        action: action as 'submit' | 'approve' | 'reject',
      });

      successResponse(res, result, '获取审核记录成功');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '获取审核记录失败');
    }
  }
);

router.get('/content/:contentId/records',
  authenticateToken,
  requirePermission('audit:read'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { contentId } = req.params;
      const records = await auditWorkflowService.getAuditRecordsByContentId(contentId);
      successResponse(res, records, '获取内容审核记录成功');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '获取内容审核记录失败');
    }
  }
);

router.get('/content/:contentId/summary',
  authenticateToken,
  requirePermission('audit:read'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { contentId } = req.params;
      const summary = await auditWorkflowService.getAuditSummary(contentId);
      successResponse(res, summary, '获取审核进度成功');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '获取审核进度失败');
    }
  }
);

router.post('/action',
  authenticateToken,
  requirePermission('audit:action'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { contentId, level, action, opinion } = req.body;

      if (!req.user) {
        errorResponse(res, 401, '用户未登录');
        return;
      }

      if (!contentId || !level || !action || !opinion) {
        errorResponse(res, 400, '缺少必填字段');
        return;
      }

      if (action !== 'approve' && action !== 'reject') {
        errorResponse(res, 400, '无效的审核操作');
        return;
      }

      const canAudit = await auditWorkflowService.canAuditAtLevel(
        req.user.permissions,
        level as 1 | 2 | 3
      );

      if (!canAudit && req.user.role !== 'super_admin') {
        errorResponse(res, 403, `没有第 ${level} 级审核权限`);
        return;
      }

      const auditData: AuditActionData = {
        contentId,
        auditorId: req.user.id,
        auditorName: req.user.realName,
        level: level as 1 | 2 | 3,
        action,
        opinion,
      };

      const result = await auditWorkflowService.processAuditAction(auditData);

      if (!result.success) {
        errorResponse(res, 400, result.message);
        return;
      }

      successResponse(res, {
        content: result.content,
        auditRecord: result.auditRecord,
      }, result.message);
    } catch (error) {
      errorResponse(res, 400, error instanceof Error ? error.message : '审核操作失败');
    }
  }
);

router.post('/content/:contentId/revoke',
  authenticateToken,
  requirePermission('audit:revoke'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { contentId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        errorResponse(res, 400, '请提供撤销原因');
        return;
      }

      const result = await auditWorkflowService.revokeAudit(contentId, reason);

      if (!result.success) {
        errorResponse(res, 400, result.message);
        return;
      }

      successResponse(res, { content: result.content as Content }, result.message);
    } catch (error) {
      errorResponse(res, 400, error instanceof Error ? error.message : '撤销审核失败');
    }
  }
);

router.get('/statistics',
  authenticateToken,
  requirePermission('audit:read'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const statistics = await auditWorkflowService.getAuditStatistics();
      successResponse(res, statistics, '获取审核统计成功');
    } catch (error) {
      errorResponse(res, 500, error instanceof Error ? error.message : '获取审核统计失败');
    }
  }
);

export default router;
