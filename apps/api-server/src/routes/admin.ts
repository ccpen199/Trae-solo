import { Router } from 'express';
import type { CreateReminderTaskRequest, AuditLogQuery } from '@gx-rs/shared';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  getDashboardSummary,
  getPassRateTrend,
  getQueryTop10,
  getUncertifiedPersons,
  getReminderTasks,
  getReminderTaskDetail,
  createReminderTask,
  getAuditLogs,
} from '../mock/admin.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/dashboard/summary', (_req, res) => {
  const data = getDashboardSummary();
  res.json({ code: 0, data });
});

router.get('/statistics/pass-rate-trend', (_req, res) => {
  const data = getPassRateTrend();
  res.json({ code: 0, data });
});

router.get('/statistics/query-top', (_req, res) => {
  const data = getQueryTop10();
  res.json({ code: 0, data });
});

router.post('/people/uncertified', (req, res) => {
  const filter = req.body;
  const data = getUncertifiedPersons(filter);
  res.json({ code: 0, data });
});

router.post('/tasks/reminder/create', (req, res) => {
  const body = req.body as CreateReminderTaskRequest;

  if (!body.name || !body.filter || !body.templateId) {
    res.status(400).json({ code: 400, message: '缺少必要参数：name, filter, templateId' });
    return;
  }

  const data = createReminderTask(body);
  res.json({ code: 0, data });
});

router.get('/tasks/reminder', (_req, res) => {
  const data = getReminderTasks();
  res.json({ code: 0, data });
});

router.get('/tasks/reminder/:id', (req, res) => {
  const { id } = req.params;
  const data = getReminderTaskDetail(id);

  if (!data) {
    res.status(404).json({ code: 404, message: '任务不存在' });
    return;
  }

  res.json({ code: 0, data });
});

router.get('/audit/logs', (req, res) => {
  const query: AuditLogQuery = {
    userId: req.query.userId as string,
    module: req.query.module as AuditLogQuery['module'],
    operation: req.query.operation as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    result: req.query.result as AuditLogQuery['result'],
    page: Number(req.query.page) || 1,
    size: Number(req.query.size) || 20,
  };

  const data = getAuditLogs(query);
  res.json({ code: 0, data });
});

export default router;
