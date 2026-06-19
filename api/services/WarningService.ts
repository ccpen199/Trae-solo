import type {
  JobWarning,
  WarningType,
  WarningSeverity,
} from '../../shared/types/index.js';
import { jobWarnings } from '../data/mockData.js';

export class WarningService {
  static getList(params: {
    type?: WarningType | 'all';
    severity?: WarningSeverity | 'all';
    page?: number;
    pageSize?: number;
  } = {}) {
    const { type = 'all', severity = 'all', page = 1, pageSize = 20 } = params;
    let list = jobWarnings.filter(w => {
      const matchType = type === 'all' || w.type === type;
      const matchSeverity = severity === 'all' || w.severity === severity;
      return matchType && matchSeverity;
    });
    const total = list.length;
    const start = (page - 1) * pageSize;
    const data = list.slice(start, start + pageSize);
    return { data, total, page, pageSize };
  }

  static getById(warningId: string): JobWarning | undefined {
    return jobWarnings.find(w => w.id === warningId);
  }

  static getOverview() {
    const total = jobWarnings.length;
    const bySeverity = jobWarnings.reduce((acc, w) => {
      acc[w.severity] = (acc[w.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byType = jobWarnings.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const critical = jobWarnings.filter(w => w.severity === 'critical').sort((a, b) =>
      new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
    return {
      total,
      bySeverity,
      byType,
      criticalCount: bySeverity.critical || 0,
      warningCount: bySeverity.warning || 0,
      recentCritical: critical.slice(0, 5),
      trend: {
        '7d': Math.floor(total * 0.3),
        '15d': Math.floor(total * 0.6),
        '30d': total,
      },
    };
  }
}
