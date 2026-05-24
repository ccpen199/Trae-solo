import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { getAuditLogs } from '../services/audit.service.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('audit', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有管理员可以查看审计日志', 403));
        return;
      }

      const { userId, action, resourceType, startTime, endTime } = req.query;

      const filters: {
        userId?: number;
        action?: string;
        resourceType?: string;
        startTime?: string;
        endTime?: string;
      } = {};

      if (userId !== undefined) {
        filters.userId = parseInt(userId as string, 10);
      }

      if (action !== undefined) {
        filters.action = action as string;
      }

      if (resourceType !== undefined) {
        filters.resourceType = resourceType as string;
      }

      if (startTime !== undefined) {
        filters.startTime = startTime as string;
      }

      if (endTime !== undefined) {
        filters.endTime = endTime as string;
      }

      const logs = await getAuditLogs(filters);
      res.status(200).json(successResponse(logs, '获取审计日志成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取审计日志失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

export default router;
