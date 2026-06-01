import { Router, Response } from 'express';
import { db, rowToScanTask, rowToVulnerability } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;
  const appId = parseInt(req.query.appId as string);
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (status) {
    whereClause += ' AND t.status = ?';
    params.push(status);
  }

  if (appId) {
    whereClause += ' AND t.app_id = ?';
    params.push(appId);
  }

  params.push(pageSize, offset);

  const rows = db.prepare(`
    SELECT t.*, a.name as app_name, v.version, e.name as env_name, u.username as triggered_by_name
    FROM scan_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN app_versions v ON t.version_id = v.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users u ON t.triggered_by = u.id
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params) as any[];

  const countParams = params.slice(0, -2);
  const totalRow = db.prepare(`
    SELECT COUNT(*) as count FROM scan_tasks t
    ${whereClause}
  `).get(...countParams) as { count: number };

  const items = rows.map(row => ({
    ...rowToScanTask(row),
    appName: row.app_name,
    version: row.version,
    envName: row.env_name,
    triggeredByName: row.triggered_by_name
  }));

  res.json({ items, total: totalRow.count, page, pageSize });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { appId, versionId, envId } = req.body;

  if (!appId || !versionId || !envId) {
    res.status(400).json({ error: 'appId, versionId, and envId are required' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO scan_tasks (app_id, version_id, env_id, status, triggered_by)
    VALUES (?, ?, ?, 'pending', ?)
  `).run(appId, versionId, envId, req.user!.id);

  const taskId = result.lastInsertRowid as number;
  const row = db.prepare('SELECT * FROM scan_tasks WHERE id = ?').get(taskId) as any;
  const task = rowToScanTask(row);

  logAudit(req.user!.id, 'create', 'task', taskId, null, JSON.stringify(task));
  res.json(task);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const row = db.prepare(`
    SELECT t.*, a.name as app_name, v.version, e.name as env_name, u.username as triggered_by_name
    FROM scan_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN app_versions v ON t.version_id = v.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users u ON t.triggered_by = u.id
    WHERE t.id = ?
  `).get(id) as any;

  if (!row) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const task = {
    ...rowToScanTask(row),
    appName: row.app_name,
    version: row.version,
    envName: row.env_name,
    triggeredByName: row.triggered_by_name
  };

  res.json(task);
});

router.post('/:id/execute', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const existingRow = db.prepare('SELECT * FROM scan_tasks WHERE id = ?').get(id) as any;
  if (!existingRow) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  if (existingRow.status === 'running') {
    res.status(400).json({ error: 'Task is already running' });
    return;
  }

  const startTime = new Date().toISOString();
  db.prepare(`
    UPDATE scan_tasks
    SET status = 'running', start_time = ?
    WHERE id = ?
  `).run(startTime, id);

  setTimeout(() => {
    const success = Math.random() > 0.2;
    const endTime = new Date().toISOString();

    if (success) {
      const severityCounts = JSON.stringify({
        critical: Math.floor(Math.random() * 3),
        high: Math.floor(Math.random() * 6),
        medium: Math.floor(Math.random() * 15),
        low: Math.floor(Math.random() * 10)
      });

      db.prepare(`
        UPDATE scan_tasks
        SET status = 'success', end_time = ?, severity_counts = ?
        WHERE id = ?
      `).run(endTime, severityCounts, id);

      const vulnPackages = [
        { name: 'lodash', cve: 'CVE-2024-1234', severity: 'high' as const },
        { name: 'express', cve: 'CVE-2024-5678', severity: 'medium' as const },
        { name: 'jsonwebtoken', cve: 'CVE-2024-9012', severity: 'critical' as const },
        { name: 'bcryptjs', cve: null, severity: 'low' as const },
        { name: 'debug', cve: null, severity: 'low' as const }
      ];

      const numVulns = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < numVulns; i++) {
        const pkg = vulnPackages[i % vulnPackages.length];
        db.prepare(`
          INSERT INTO vulnerabilities (task_id, cve_id, package_name, current_version, fixed_version, severity, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          pkg.cve,
          pkg.name,
          `${Math.floor(Math.random() * 4)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
          `${Math.floor(Math.random() * 4)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20 + 1)}`,
          pkg.severity,
          `Security vulnerability in ${pkg.name}`
        );
      }
    } else {
      db.prepare(`
        UPDATE scan_tasks
        SET status = 'failed', end_time = ?
        WHERE id = ?
      `).run(endTime, id);

      db.prepare(`
        INSERT INTO alerts (type, severity, status, assignee_id, title, content, suggested_action, close_criteria)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'task_failure',
        'high',
        'open',
        req.user!.id,
        `扫描任务 #${id} 执行失败`,
        '扫描任务执行过程中发生错误，请检查配置。',
        '重新运行扫描任务并检查环境配置',
        '任务成功执行完成'
      );
    }

    logAudit(req.user!.id, 'execute', 'task', id);
  }, 2000);

  const updatedRow = db.prepare('SELECT * FROM scan_tasks WHERE id = ?').get(id) as any;
  const task = rowToScanTask(updatedRow);

  logAudit(req.user!.id, 'execute_start', 'task', id);
  res.json({ ...task, message: 'Task execution started' });
});

router.get('/:id/vulnerabilities', authMiddleware, (req: AuthRequest, res: Response) => {
  const taskId = parseInt(req.params.id);

  const rows = db.prepare(`
    SELECT * FROM vulnerabilities
    WHERE task_id = ?
    ORDER BY severity DESC, created_at
  `).all(taskId) as any[];

  const items = rows.map(rowToVulnerability);
  res.json({ items, total: items.length });
});

export default router;
