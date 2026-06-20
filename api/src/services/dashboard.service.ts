import { db } from '../database/connection';
import { taskRepository } from '../repositories/task.repository';
import { messageRepository } from '../repositories/message.repository';
import type { GlobalDashboardData } from '../../../shared/types';

interface OverviewData {
  todayTasks: number;
  todayCompleted: number;
  pendingTasks: number;
  exceptionTasks: number;
  totalRevenue: number;
  unreadMessages: number;
  recentTasks: any[];
  hourlyTrend: { hour: string; tasks: number }[];
}

export const dashboardService = {
  getOverview(userId: string, role: string, outletId?: string): OverviewData {
    const today = new Date().toISOString().slice(0, 10);

    let taskFilters: any = { startDate: today, endDate: today, pageSize: 1000 };
    let allFilters: any = { pageSize: 1000 };

    if (role === 'courier') {
      taskFilters.courierId = userId;
      allFilters.courierId = userId;
    } else if (role === 'admin' && outletId) {
      taskFilters.outletId = outletId;
      allFilters.outletId = outletId;
    }

    const { list: todayTasks } = taskRepository.findAll(taskFilters);
    const { list: allTasks } = taskRepository.findAll(allFilters);

    const totalRevenue = todayTasks
      .filter(t => t.status === 'completed' && t.freight)
      .reduce((sum, t) => sum + (t.freight || 0), 0);

    const unreadCount = messageRepository.getUnreadCount(
      role === 'courier' ? userId : undefined,
      role === 'admin' ? outletId : undefined
    );

    const hourlyData: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[`${String(i).padStart(2, '0')}:00`] = 0;
    }

    todayTasks.forEach(task => {
      if (task.createdAt) {
        const hour = task.createdAt.slice(11, 13) + ':00';
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      }
    });

    const hourlyTrend = Object.entries(hourlyData).map(([hour, tasks]) => ({ hour, tasks }));

    return {
      todayTasks: todayTasks.length,
      todayCompleted: todayTasks.filter(t => t.status === 'completed').length,
      pendingTasks: allTasks.filter(t => ['pending', 'assigned'].includes(t.status)).length,
      exceptionTasks: allTasks.filter(t => t.status === 'exception').length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      unreadMessages: unreadCount,
      recentTasks: todayTasks.slice(0, 5),
      hourlyTrend,
    };
  },

  getGlobalData(): GlobalDashboardData {
    const today = new Date().toISOString().slice(0, 10);

    const totalOutlets = db.prepare("SELECT COUNT(*) as count FROM outlets").get() as { count: number };
    const totalCouriers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'courier'").get() as { count: number };

    const todayStats = db.prepare(`
      SELECT
        COUNT(*) as totalTasksToday,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasksToday,
        SUM(CASE WHEN status IN ('pending', 'assigned', 'picked', 'in_transit') THEN 1 ELSE 0 END) as pendingTasks,
        SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exceptionTasks,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN freight ELSE 0 END), 0) as totalRevenueToday
      FROM pickup_tasks
      WHERE date(created_at) = date(?)
    `).get(today) as any;

    const avgPickupTime = db.prepare(`
      SELECT AVG(
        CAST((JulianDay(completed_at) - JulianDay(picked_at)) * 24 * 60 AS INTEGER)
      ) as avgMinutes
      FROM pickup_tasks
      WHERE status = 'completed' AND picked_at IS NOT NULL AND completed_at IS NOT NULL
        AND date(created_at) >= date(?, '-7 days')
    `).get(today) as { avgMinutes: number };

    const outletRankings = db.prepare(`
      SELECT
        o.id as outletId,
        o.name as outletName,
        COUNT(pt.id) as completedTasks,
        COALESCE(SUM(pt.freight), 0) as totalRevenue
      FROM outlets o
      LEFT JOIN pickup_tasks pt ON o.id = pt.outlet_id AND pt.status = 'completed'
      WHERE date(pt.created_at) = date(?) OR pt.created_at IS NULL
      GROUP BY o.id, o.name
      ORDER BY completedTasks DESC
      LIMIT 5
    `).all(today) as any[];

    const hourlyData: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[`${String(i).padStart(2, '0')}:00`] = 0;
    }

    const todayTasksHourly = db.prepare(`
      SELECT strftime('%H:00', created_at) as hour, COUNT(*) as count
      FROM pickup_tasks
      WHERE date(created_at) = date(?)
      GROUP BY strftime('%H:00', created_at)
    `).all(today) as { hour: string; count: number }[];

    todayTasksHourly.forEach(row => {
      hourlyData[row.hour] = row.count;
    });

    const hourlyTrend = Object.entries(hourlyData).map(([hour, tasks]) => ({ hour, tasks }));

    const recentExceptions = db.prepare(`
      SELECT pt.id as taskId, pt.order_no as orderNo, pt.exception_reason as reason, pt.created_at as createdAt
      FROM pickup_tasks pt
      WHERE pt.status = 'exception'
      ORDER BY pt.created_at DESC
      LIMIT 10
    `).all() as any[];

    return {
      totalOutlets: totalOutlets.count,
      totalCouriers: totalCouriers.count,
      totalTasksToday: todayStats.totalTasksToday || 0,
      completedTasksToday: todayStats.completedTasksToday || 0,
      pendingTasks: todayStats.pendingTasks || 0,
      exceptionTasks: todayStats.exceptionTasks || 0,
      totalRevenueToday: Number(todayStats.totalRevenueToday?.toFixed(2) || 0),
      averagePickupTime: Math.round(avgPickupTime.avgMinutes || 0),
      outletRankings,
      hourlyTrend,
      recentExceptions,
    };
  },
};
