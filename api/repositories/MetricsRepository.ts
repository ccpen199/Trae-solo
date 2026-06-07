import { BaseRepository } from './BaseRepository.js';
import { MetricsOverview, BottleneckNode } from '../types/index.js';
import db from '../db.js';

export class MetricsRepository extends BaseRepository<any> {
  constructor() {
    super('metrics');
  }

  getOverview(): MetricsOverview {
    const stmt = db.prepare(`
      SELECT 
        SUM(total_applications) as totalApplications,
        SUM(completed_applications) as completedApplications,
        AVG(avg_handling_time) as averageHandlingTime,
        AVG(satisfaction_score) as satisfactionScore,
        AVG(nps_score) as npsScore,
        SUM(over_warning_count) as overWarningCount
      FROM metrics
      WHERE stat_date >= DATE('now', '-30 days')
    `);
    const result = stmt.get() as {
      totalApplications: number;
      completedApplications: number;
      averageHandlingTime: number;
      satisfactionScore: number;
      npsScore: number;
      overWarningCount: number;
    };

    const bottleneckNodes = this.getBottleneckNodes();

    return {
      totalApplications: result.totalApplications || 0,
      completionRate: result.totalApplications 
        ? Math.round((result.completedApplications / result.totalApplications) * 100) 
        : 0,
      averageHandlingTime: Math.round(result.averageHandlingTime || 0),
      satisfactionScore: Math.round(result.satisfactionScore || 0),
      npsScore: Math.round(result.npsScore || 0),
      overWarningCount: result.overWarningCount || 0,
      bottleneckNodes,
    };
  }

  getBottleneckNodes(): BottleneckNode[] {
    const stmt = db.prepare(`
      SELECT 
        an.node_name as nodeName,
        an.department,
        AVG(JULIANDAY(COALESCE(an.handled_at, CURRENT_TIMESTAMP)) - JULIANDAY(an.created_at)) * 24 * 60 as avgWaitTime,
        COUNT(*) as pendingCount
      FROM approval_nodes an
      WHERE an.handled_at IS NULL
      GROUP BY an.node_name, an.department
      HAVING pendingCount > 0
      ORDER BY avgWaitTime DESC
      LIMIT 5
    `);
    const rows = stmt.all() as Array<{
      nodeName: string;
      department: string;
      avgWaitTime: number;
      pendingCount: number;
    }>;

    return rows.map(r => ({
      nodeName: r.nodeName,
      department: r.department,
      avgWaitTime: Math.round(r.avgWaitTime),
      pendingCount: r.pendingCount,
      severity: r.avgWaitTime > 1440 ? 'high' : r.avgWaitTime > 480 ? 'medium' : 'low',
    }));
  }

  getDailyTrend(days: number = 7): Array<{ date: string; count: number; completed: number }> {
    const stmt = db.prepare(`
      SELECT 
        stat_date as date,
        total_applications as count,
        completed_applications as completed
      FROM metrics
      WHERE stat_date >= DATE('now', ?)
      ORDER BY stat_date ASC
    `);
    return stmt.all(`-${days} days`) as Array<{ date: string; count: number; completed: number }>;
  }

  getDepartmentStats(): Array<{ department: string; count: number; avgTime: number }> {
    const stmt = db.prepare(`
      SELECT 
        s.department,
        COUNT(a.id) as count,
        AVG(CAST((julianday(a.completed_at) - julianday(a.submitted_at)) * 24 * 60 as INTEGER)) as avgTime
      FROM applications a
      JOIN service_items s ON a.service_id = s.id
      WHERE a.submitted_at IS NOT NULL
      GROUP BY s.department
      ORDER BY count DESC
      LIMIT 10
    `);
    return stmt.all() as Array<{ department: string; count: number; avgTime: number }>;
  }
}
