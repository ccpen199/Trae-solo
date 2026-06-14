import { PackageRepository } from '../repositories/PackageRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { AlertRepository } from '../repositories/AlertRepository';
import { SettlementRepository } from '../repositories/SettlementRepository';
import { getDb } from '../database';

const packageRepo = new PackageRepository();
const taskRepo = new TaskRepository();
const alertRepo = new AlertRepository();
const settlementRepo = new SettlementRepository();

export class DashboardService {
  getStats(branchId?: number) {
    const packagesByStatus = packageRepo.countByStatus(branchId);
    const packagesByBrand = packageRepo.countByBrand(branchId);

    const db = getDb();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStr = todayStart.toISOString().slice(0, 10);

    let tasksToday = 0;
    let tasksCompletedToday = 0;
    if (branchId) {
      tasksToday = (db.prepare(
        `SELECT COUNT(*) as count FROM pickup_tasks WHERE date(created_at) = date('now', 'localtime') AND branch_id = ?`
      ).get(branchId) as any)?.count || 0;
      tasksCompletedToday = (db.prepare(
        `SELECT COUNT(*) as count FROM pickup_tasks WHERE date(completed_at) = date('now', 'localtime') AND status = 'completed' AND branch_id = ?`
      ).get(branchId) as any)?.count || 0;
    } else {
      tasksToday = (db.prepare(
        `SELECT COUNT(*) as count FROM pickup_tasks WHERE date(created_at) = date('now', 'localtime')`
      ).get() as any)?.count || 0;
      tasksCompletedToday = (db.prepare(
        `SELECT COUNT(*) as count FROM pickup_tasks WHERE date(completed_at) = date('now', 'localtime') AND status = 'completed'`
      ).get() as any)?.count || 0;
    }

    const pendingAlerts = alertRepo.countActive();

    const feeSummary = packageRepo.sumFees(branchId);

    let settlementRows: any[];
    if (branchId) {
      settlementRows = db.prepare(
        `SELECT status, COUNT(*) as count, COALESCE(SUM(net_amount), 0) as total FROM settlements WHERE branch_id = ? GROUP BY status`
      ).all(branchId) as any[];
    } else {
      settlementRows = db.prepare(
        `SELECT status, COUNT(*) as count, COALESCE(SUM(net_amount), 0) as total FROM settlements GROUP BY status`
      ).all() as any[];
    }

    const settlementSummary: Record<string, any> = {};
    for (const row of settlementRows) {
      settlementSummary[row.status] = { count: row.count, total: row.total };
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        packagesByStatus,
        packagesByBrand,
        tasksToday,
        tasksCompletedToday,
        pendingAlerts,
        feeSummary,
        settlementSummary,
      },
    };
  }
}
