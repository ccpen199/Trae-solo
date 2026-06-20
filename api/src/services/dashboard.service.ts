import { db } from '../database/connection';
import { taskRepository } from '../repositories/task.repository';
import { messageRepository } from '../repositories/message.repository';
import { waybillRepository } from '../repositories/waybill.repository';
import { financeRepository } from '../repositories/finance.repository';
import type { GlobalDashboardData, Message, WaybillAccount, BankCard, WithdrawRecord } from '../../../shared/types';

export interface AlertBanner {
  id: string;
  type: 'balance_alert' | 'pickup_reminder' | 'suspension_notice' | 'withdraw_notice' | 'exception_alert' | 'info';
  level: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  content: string;
  actionLabel?: string;
  actionPath?: string;
}

export interface OverviewData {
  stats: {
    pending: number;
    completed: number;
    exception: number;
    todayIncome: number;
    totalTasks: number;
  };
  recentTasks: any[];
  hourlyTrend: { hour: string; tasks: number }[];
  messages: string[];
  alerts: AlertBanner[];
  waybill?: WaybillAccount;
  unreadCount: number;
  latestWithdraw?: WithdrawRecord;
  defaultBankCard?: BankCard;
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

    const todayCompletedTasks = todayTasks.filter(t => t.status === 'completed' || t.status === 'printed' || t.status === 'in_transit');
    const totalRevenue = todayCompletedTasks
      .filter(t => t.freight)
      .reduce((sum, t) => sum + (t.freight || 0), 0);

    const pendingCount = allTasks.filter(t => ['pending', 'assigned'].includes(t.status)).length;
    const completedCount = allTasks.filter(t => ['completed', 'printed', 'in_transit'].includes(t.status)).length;
    const exceptionCount = allTasks.filter(t => t.status === 'exception').length;

    const unreadCount = messageRepository.getUnreadCount(
      role === 'courier' ? userId : undefined,
      role === 'admin' ? outletId : undefined
    );

    const hourlyData: Record<string, number> = {};
    for (let i = 6; i < 22; i++) {
      hourlyData[`${String(i).padStart(2, '0')}:00`] = 0;
    }

    todayTasks.forEach(task => {
      if (task.createdAt) {
        const hour = task.createdAt.slice(11, 13) + ':00';
        if (hourlyData.hasOwnProperty(hour)) {
          hourlyData[hour] = (hourlyData[hour] || 0) + 1;
        }
      }
    });

    const hourlyTrend = Object.entries(hourlyData).map(([hour, tasks]) => ({ hour, tasks }));

    const messages: Message[] = messageRepository.findForUser(
      role === 'courier' ? userId : undefined,
      role === 'admin' ? outletId : undefined,
      { pageSize: 5 }
    ).list;

    const messageTicker: string[] = messages.map(m => `【${m.title}】${m.content}`);

    const alerts: AlertBanner[] = [];

    if (role === 'admin' && outletId) {
      const waybill = waybillRepository.findByOutletId(outletId);
      if (waybill) {
        if (waybill.balance <= waybill.lowBalanceThreshold) {
          alerts.push({
            id: 'balance-' + waybill.id,
            type: 'balance_alert',
            level: waybill.balance < 10 ? 'danger' : 'warning',
            title: '面单余额不足',
            content: `当前余额 ¥${waybill.balance.toFixed(2)}，已低于告警阈值 ¥${waybill.lowBalanceThreshold.toFixed(2)}，请尽快充值以免影响打印作业`,
            actionLabel: '立即充值',
            actionPath: '/waybill-recharge',
          });
        }
      }

      const cards = financeRepository.listBankCards(outletId);
      if (cards.length === 0) {
        alerts.push({
          id: 'bankcard-' + outletId,
          type: 'info',
          level: 'warning',
          title: '未绑定收款银行卡',
          content: '请先绑定提现银行卡，以便后续申请资金提现',
          actionLabel: '绑定银行卡',
          actionPath: '/bank-cards',
        });
      }

      const latestWithdraw = financeRepository.listWithdrawRecords({ outletId, pageSize: 1 }).list[0];
      if (latestWithdraw && latestWithdraw.status === 'transferred') {
        alerts.push({
          id: 'withdraw-' + latestWithdraw.id,
          type: 'withdraw_notice',
          level: 'success',
          title: '提现已到账',
          content: `提现 ¥${latestWithdraw.amount.toFixed(2)} 已于 ${latestWithdraw.transferredAt?.slice(0, 16)} 到账 ${latestWithdraw.bankName} ${latestWithdraw.cardNumber.slice(-4)}`,
          actionLabel: '查看流水',
          actionPath: '/withdraw-records',
        });
      }
    }

    const overduePendingTasks = allTasks.filter(t => {
      if (!['pending', 'assigned'].includes(t.status)) return false;
      const apt = new Date(t.appointmentTime).getTime();
      const now = Date.now();
      return apt < now - 30 * 60 * 1000;
    });
    if (overduePendingTasks.length > 0) {
      alerts.push({
        id: 'overdue-pickup',
        type: 'pickup_reminder',
        level: 'danger',
        title: '催揽提醒',
        content: `有 ${overduePendingTasks.length} 个揽收任务已超过预约时间 30 分钟未处理，请优先上门揽收`,
        actionLabel: '查看任务',
        actionPath: '/tasks?status=pending',
      });
    }

    const suspensionMessages = messages.filter(m => m.type === 'suspension_notice' && !m.isRead);
    suspensionMessages.forEach(m => {
      alerts.push({
        id: 'suspension-' + m.id,
        type: 'suspension_notice',
        level: 'warning',
        title: m.title,
        content: m.content,
        actionLabel: '查看详情',
        actionPath: '/messages',
      });
    });

    if (exceptionCount > 0) {
      alerts.push({
        id: 'exception-' + today,
        type: 'exception_alert',
        level: 'warning',
        title: '异常订单提醒',
        content: `当前有 ${exceptionCount} 个异常订单，请及时跟进处理`,
        actionLabel: '处理异常',
        actionPath: role === 'operator' ? '/global-dashboard' : '/tasks?status=exception',
      });
    }

    const alertsSorted = alerts.sort((a, b) => {
      const rank: Record<string, number> = { danger: 0, warning: 1, info: 2, success: 3 };
      return rank[a.level] - rank[b.level];
    });

    let waybill: WaybillAccount | undefined;
    if ((role === 'admin' || role === 'operator') && outletId) {
      waybill = waybillRepository.findByOutletId(outletId) || undefined;
    }

    let latestWithdraw: WithdrawRecord | undefined;
    let defaultBankCard: BankCard | undefined;
    if (role === 'admin' && outletId) {
      latestWithdraw = financeRepository.listWithdrawRecords({ outletId, pageSize: 1 }).list[0];
      defaultBankCard = financeRepository.listBankCards(outletId).find(c => c.isDefault);
    }

    return {
      stats: {
        pending: pendingCount,
        completed: completedCount,
        exception: exceptionCount,
        todayIncome: Number(totalRevenue.toFixed(2)),
        totalTasks: allTasks.length,
      },
      recentTasks: todayTasks.slice(0, 5),
      hourlyTrend,
      messages: messageTicker,
      alerts: alertsSorted,
      waybill,
      unreadCount,
      latestWithdraw,
      defaultBankCard,
    };
  },

  getGlobalData(): GlobalDashboardData {
    const today = new Date().toISOString().slice(0, 10);

    const totalOutlets = db.prepare("SELECT COUNT(*) as count FROM outlets").get() as { count: number };
    const totalCouriers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'courier'").get() as { count: number };

    const todayStats = db.prepare(`
      SELECT
        COUNT(*) as totalTasksToday,
        SUM(CASE WHEN status IN ('completed','printed','in_transit') THEN 1 ELSE 0 END) as completedTasksToday,
        SUM(CASE WHEN status IN ('pending', 'assigned', 'picked') THEN 1 ELSE 0 END) as pendingTasks,
        SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exceptionTasks,
        COALESCE(SUM(CASE WHEN status IN ('completed','printed','in_transit') THEN freight ELSE 0 END), 0) as totalRevenueToday
      FROM pickup_tasks
      WHERE date(created_at) = date(?)
    `).get(today) as any;

    const allStats = db.prepare(`
      SELECT
        COUNT(*) as totalTasks,
        COALESCE(SUM(CASE WHEN status IN ('completed','printed','in_transit') THEN freight ELSE 0 END), 0) as totalRevenue
      FROM pickup_tasks
    `).get() as any;

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
      LEFT JOIN pickup_tasks pt ON o.id = pt.outlet_id AND pt.status IN ('completed','printed','in_transit')
      WHERE date(pt.created_at) = date(?) OR pt.created_at IS NULL
      GROUP BY o.id, o.name
      ORDER BY completedTasks DESC
      LIMIT 10
    `).all(today) as any[];

    const hourlyData: Record<string, number> = {};
    for (let i = 6; i < 22; i++) {
      hourlyData[`${String(i).padStart(2, '0')}:00`] = 0;
    }

    const todayTasksHourly = db.prepare(`
      SELECT strftime('%H:00', created_at) as hour, COUNT(*) as count
      FROM pickup_tasks
      WHERE date(created_at) = date(?)
      GROUP BY strftime('%H:00', created_at)
    `).all(today) as { hour: string; count: number }[];

    todayTasksHourly.forEach(row => {
      if (hourlyData.hasOwnProperty(row.hour)) {
        hourlyData[row.hour] = row.count;
      }
    });

    const hourlyTrend = Object.entries(hourlyData).map(([hour, tasks]) => ({ hour, tasks }));

    const recentExceptions = db.prepare(`
      SELECT pt.id as id, pt.id as taskId, pt.order_no as orderNo, pt.exception_reason as exceptionReason,
             pt.exception_reason as reason, pt.status as status, pt.created_at as createdAt,
             o.name as outletName, u.name as courierName
      FROM pickup_tasks pt
      LEFT JOIN outlets o ON o.id = pt.outlet_id
      LEFT JOIN users u ON u.id = pt.courier_id
      WHERE pt.status = 'exception'
      ORDER BY pt.created_at DESC
      LIMIT 20
    `).all() as any[];

    return {
      totalOutlets: totalOutlets.count,
      totalCouriers: totalCouriers.count,
      totalTasks: allStats.totalTasks || 0,
      totalRevenue: Number(allStats.totalRevenue?.toFixed(2) || 0),
      totalTasksToday: todayStats.totalTasksToday || 0,
      completedTasksToday: todayStats.completedTasksToday || 0,
      pendingTasks: todayStats.pendingTasks || 0,
      pending: todayStats.pendingTasks || 0,
      exceptionTasks: todayStats.exceptionTasks || 0,
      exception: todayStats.exceptionTasks || 0,
      totalRevenueToday: Number(todayStats.totalRevenueToday?.toFixed(2) || 0),
      averagePickupTime: Math.round(avgPickupTime.avgMinutes || 0),
      outletRankings,
      hourlyTrend,
      recentExceptions,
    };
  },
};
