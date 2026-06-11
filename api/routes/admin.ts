import { Router, Request, Response } from 'express';
import adminService from '../services/admin.service.js';
import authMiddleware from '../middleware/auth.middleware.js';
import auditMiddleware from '../middleware/audit.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import { TaskStatus, TalentLevel } from '../../shared/types.js';

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get('/platform-stats', async (req: Request, res: Response) => {
  const result = await adminService.getPlatformStats();
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/task-board', async (req: Request, res: Response) => {
  const result = await adminService.getTaskBoard(req.query.status as TaskStatus | undefined);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.put('/tasks/:id/status', auditMiddleware('update_task_status', 'task'), async (req: Request, res: Response) => {
  const result = await adminService.updateTaskStatus(
    Number(req.params.id),
    req.body.status as TaskStatus,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/talents', async (req: Request, res: Response) => {
  const result = await adminService.getTalentList({
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 20,
    level: req.query.level as TalentLevel,
    verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
  });
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/audit-logs', async (req: Request, res: Response) => {
  const result = await adminService.getAuditLogs({
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 20,
    userId: req.query.userId ? Number(req.query.userId) : undefined,
    action: req.query.action as string,
    resourceType: req.query.resourceType as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
  });
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

export default router;
