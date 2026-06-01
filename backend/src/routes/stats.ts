import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { DashboardStats, TaskStatus, VulnSeverity } from '../types.js';

const router = Router();

router.get('/dashboard', authMiddleware, (req: AuthRequest, res: Response) => {
  const totalApps = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM scan_tasks').get() as { count: number };
  const totalAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts').get() as { count: number };
  const totalVulns = db.prepare('SELECT COUNT(*) as count FROM vulnerabilities').get() as { count: number };

  const tasksByStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM scan_tasks
    GROUP BY status
  `).all() as { status: string; count: number }[];

  const alertsBySeverity = db.prepare(`
    SELECT severity, COUNT(*) as count
    FROM alerts
    WHERE status != 'closed'
    GROUP BY severity
  `).all() as { severity: string; count: number }[];

  const vulnsBySeverity = db.prepare(`
    SELECT severity, COUNT(*) as count
    FROM vulnerabilities
    WHERE status = 'open'
    GROUP BY severity
  `).all() as { severity: string; count: number }[];

  const recentTaskRows = db.prepare(`
    SELECT t.*, a.name as app_name, v.version, e.name as env_name, u.username as triggered_by_name
    FROM scan_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN app_versions v ON t.version_id = v.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users u ON t.triggered_by = u.id
    ORDER BY t.created_at DESC
    LIMIT 5
  `).all() as any[];

  const recentAlertRows = db.prepare(`
    SELECT a.*, u.username as assignee_name
    FROM alerts a
    LEFT JOIN users u ON a.assignee_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 5
  `).all() as any[];

  const stats: DashboardStats = {
    totalApplications: totalApps.count,
    totalTasks: totalTasks.count,
    totalAlerts: totalAlerts.count,
    totalVulnerabilities: totalVulns.count,
    tasksByStatus: {
      pending: 0,
      running: 0,
      success: 0,
      failed: 0
    } as Record<TaskStatus, number>,
    alertsBySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    } as Record<VulnSeverity, number>,
    vulnerabilitiesBySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    } as Record<VulnSeverity, number>,
    recentTasks: recentTaskRows.map(row => ({
      id: row.id,
      appId: row.app_id,
      versionId: row.version_id,
      envId: row.env_id,
      status: row.status,
      severityCounts: row.severity_counts,
      startTime: row.start_time,
      endTime: row.end_time,
      triggeredBy: row.triggered_by,
      createdAt: row.created_at,
      appName: row.app_name,
      version: row.version,
      envName: row.env_name,
      triggeredByName: row.triggered_by_name
    })),
    recentAlerts: recentAlertRows.map(row => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      status: row.status,
      assigneeId: row.assignee_id,
      title: row.title,
      content: row.content,
      suggestedAction: row.suggested_action,
      closeCriteria: row.close_criteria,
      createdAt: row.created_at,
      closedAt: row.closed_at,
      assigneeName: row.assignee_name
    }))
  };

  tasksByStatus.forEach(item => {
    stats.tasksByStatus[item.status as TaskStatus] = item.count;
  });

  alertsBySeverity.forEach(item => {
    stats.alertsBySeverity[item.severity as VulnSeverity] = item.count;
  });

  vulnsBySeverity.forEach(item => {
    stats.vulnerabilitiesBySeverity[item.severity as VulnSeverity] = item.count;
  });

  res.json(stats);
});

export default router;
