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
    const taskStatusCounts = taskRepo.countByStatus(branchId);

    const db = getDb();

    let totalPackages = 0;
    if (branchId) {
      totalPackages = ((db.prepare('SELECT COUNT(*) as count FROM packages WHERE branch_id = ?').get(branchId) as any)?.count || 0);
    } else {
      totalPackages = ((db.prepare('SELECT COUNT(*) as count FROM packages').get() as any)?.count || 0);
    }

    let todayTasks = 0;
    if (branchId) {
      todayTasks = ((db.prepare(
        `SELECT COUNT(*) as count FROM pickup_tasks WHERE date(created_at) = date('now', 'localtime') AND branch_id = ?`
      ).get(branchId) as any)?.count || 0);
    } else {
      todayTasks = ((db.prepare(
        `SELECT COUNT(*) as count FROM pickup_tasks WHERE date(created_at) = date('now', 'localtime')`
      ).get() as any)?.count || 0);
    }

    const activeAlerts = alertRepo.countActive();

    let totalSettlementAmount = 0;
    if (branchId) {
      totalSettlementAmount = ((db.prepare(
        `SELECT COALESCE(SUM(net_amount), 0) as total FROM settlements WHERE branch_id = ?`
      ).get(branchId) as any)?.total || 0);
    } else {
      totalSettlementAmount = ((db.prepare(
        `SELECT COALESCE(SUM(net_amount), 0) as total FROM settlements`
      ).get() as any)?.total || 0);
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        totalPackages,
        todayTasks,
        activeAlerts,
        totalSettlementAmount,
        packagesByStatus,
        packagesByBrand,
        taskStatusCounts,
      },
    };
  }
}
