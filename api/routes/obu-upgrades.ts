import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, requireRoles, getClientIp, getUserAgent, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { ObuUpgradeTaskResponse, ObuUpgradeLogResponse, UpgradeTaskStatus, UpgradeLogStatus } from '../types.js';

const router = Router();

router.get('/tasks', authenticate, requireRoles('admin', 'operation', 'maintenance'), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const offset = (page - 1) * pageSize;
  const status = req.query.status as string | undefined;
  const keyword = req.query.keyword as string | undefined;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (status) {
    where += ' AND t.status = ?';
    params.push(status);
  }
  if (keyword) {
    where += ' AND (t.name LIKE ? OR t.task_no LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM obu_upgrade_tasks t ${where}`).get(...params) as { count: number };
  const list = db.prepare(`
    SELECT t.*, u.name as created_by_name
    FROM obu_upgrade_tasks t
    LEFT JOIN users u ON t.created_by = u.id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as ObuUpgradeTaskResponse[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/tasks/:id', authenticate, requireRoles('admin', 'operation', 'maintenance'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const task = db.prepare(`
    SELECT t.*, u.name as created_by_name
    FROM obu_upgrade_tasks t
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.id = ?
  `).get(id) as ObuUpgradeTaskResponse | undefined;

  if (!task) {
    res.status(404).json({ success: false, error: '升级任务不存在' });
    return;
  }

  res.json({ success: true, data: task });
});

router.post('/tasks', authenticate, requireRoles('admin', 'operation', 'maintenance'), (req: AuthRequest, res: Response): void => {
  try {
    const { name, description, firmware_version, firmware_url, obu_ids } = req.body;

    if (!name || !firmware_version || !firmware_url) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }

    const taskNo = `UPG${new Date().getFullYear()}${Date.now().toString().slice(-8)}`;
    const totalDevices = Array.isArray(obu_ids) ? obu_ids.length : 0;

    const info = db.prepare(`
      INSERT INTO obu_upgrade_tasks (task_no, name, description, firmware_version, firmware_url, status, total_devices, created_by)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(taskNo, name, description || null, firmware_version, firmware_url, totalDevices, req.user?.id || 1);

    const taskId = Number(info.lastInsertRowid);

    if (Array.isArray(obu_ids)) {
      const insertLog = db.prepare(`
        INSERT INTO obu_upgrade_logs (task_id, obu_id, status, progress)
        VALUES (?, ?, 'pending', 0)
      `);
      for (const obuId of obu_ids) {
        insertLog.run(taskId, obuId);
      }
    }

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create',
        resourceType: 'obu_upgrade_task',
        resourceId: taskId,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `创建升级任务: ${name}, 版本: ${firmware_version}`,
      });
    }

    const task = db.prepare('SELECT * FROM obu_upgrade_tasks WHERE id = ?').get(taskId) as ObuUpgradeTaskResponse;
    res.json({ success: true, data: task });
  } catch (e: any) {
    console.error('[Upgrade Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/tasks/:id', authenticate, requireRoles('admin', 'operation', 'maintenance'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const existing = db.prepare('SELECT * FROM obu_upgrade_tasks WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '升级任务不存在' });
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let startedAt = existing.started_at;
    let completedAt = existing.completed_at;

    if (status === 'running' && existing.status !== 'running') {
      startedAt = now;
    } else if ((status === 'completed' || status === 'cancelled') && existing.status !== 'completed' && existing.status !== 'cancelled') {
      completedAt = now;
    }

    db.prepare(`
      UPDATE obu_upgrade_tasks
      SET status = COALESCE(?, status),
          started_at = ?,
          completed_at = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(status || null, startedAt, completedAt, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'upgrade',
        resourceType: 'obu_upgrade_task',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `更新升级任务状态: ${existing.name} -> ${status}`,
      });
    }

    const task = db.prepare('SELECT * FROM obu_upgrade_tasks WHERE id = ?').get(id) as ObuUpgradeTaskResponse;
    res.json({ success: true, data: task });
  } catch (e: any) {
    console.error('[Upgrade Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/tasks/:id/logs', authenticate, requireRoles('admin', 'operation', 'maintenance'), (req: AuthRequest, res: Response): void => {
  const taskId = parseInt(req.params.id);
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 50;
  const offset = (page - 1) * pageSize;
  const status = req.query.status as string | undefined;

  let where = 'WHERE l.task_id = ?';
  const params: (string | number)[] = [taskId];

  if (status) {
    where += ' AND l.status = ?';
    params.push(status);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM obu_upgrade_logs l ${where}`).get(...params) as { count: number };
  const list = db.prepare(`
    SELECT l.*, o.sn as obu_sn, t.name as task_name
    FROM obu_upgrade_logs l
    INNER JOIN obu_devices o ON l.obu_id = o.id
    INNER JOIN obu_upgrade_tasks t ON l.task_id = t.id
    ${where}
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as ObuUpgradeLogResponse[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/logs/:id', authenticate, requireRoles('admin', 'operation', 'maintenance'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const log = db.prepare(`
    SELECT l.*, o.sn as obu_sn, t.name as task_name
    FROM obu_upgrade_logs l
    INNER JOIN obu_devices o ON l.obu_id = o.id
    INNER JOIN obu_upgrade_tasks t ON l.task_id = t.id
    WHERE l.id = ?
  `).get(id) as ObuUpgradeLogResponse | undefined;

  if (!log) {
    res.status(404).json({ success: false, error: '升级日志不存在' });
    return;
  }

  res.json({ success: true, data: log });
});

router.put('/logs/:id', authenticate, requireRoles('admin', 'operation', 'maintenance'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { status, progress, error_message } = req.body;

    const existing = db.prepare('SELECT * FROM obu_upgrade_logs WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '升级日志不存在' });
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let startedAt = existing.started_at;
    let completedAt = existing.completed_at;

    if ((status === 'downloading' || status === 'installing') && !existing.started_at) {
      startedAt = now;
    } else if ((status === 'success' || status === 'failed') && !existing.completed_at) {
      completedAt = now;
    }

    db.prepare(`
      UPDATE obu_upgrade_logs
      SET status = COALESCE(?, status),
          progress = COALESCE(?, progress),
          error_message = COALESCE(?, error_message),
          started_at = ?,
          completed_at = ?
      WHERE id = ?
    `).run(status || null, progress ?? null, error_message ?? null, startedAt, completedAt, id);

    if (status === 'success' || status === 'failed') {
      db.prepare(`
        UPDATE obu_upgrade_tasks
        SET success_count = (SELECT COUNT(*) FROM obu_upgrade_logs WHERE task_id = ? AND status = 'success'),
            failed_count = (SELECT COUNT(*) FROM obu_upgrade_logs WHERE task_id = ? AND status = 'failed'),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(existing.task_id, existing.task_id, existing.task_id);
    }

    res.json({ success: true });
  } catch (e: any) {
    console.error('[Upgrade Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/options/task-statuses', authenticate, (req: AuthRequest, res: Response): void => {
  const statuses: UpgradeTaskStatus[] = ['pending', 'running', 'paused', 'completed', 'cancelled'];
  const options = statuses.map(s => ({
    value: s,
    label: s === 'pending' ? '待执行' : s === 'running' ? '进行中' : s === 'paused' ? '已暂停' : s === 'completed' ? '已完成' : '已取消'
  }));
  res.json({ success: true, data: options });
});

router.get('/options/log-statuses', authenticate, (req: AuthRequest, res: Response): void => {
  const statuses: UpgradeLogStatus[] = ['pending', 'downloading', 'installing', 'success', 'failed'];
  const options = statuses.map(s => ({
    value: s,
    label: s === 'pending' ? '待升级' : s === 'downloading' ? '下载中' : s === 'installing' ? '安装中' : s === 'success' ? '成功' : '失败'
  }));
  res.json({ success: true, data: options });
});

export default router;
