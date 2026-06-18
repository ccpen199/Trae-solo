import cron from 'node-cron';
import logger, { auditLogger } from '../utils/logger';
import FeedbackAnalyticsEngine from '../engines/FeedbackAnalyticsEngine';
import { DepartmentAdapterManager } from '../adapters/DepartmentAdapterManager';

@cron.Schedule
export class ScheduledTasks {
  private static initialized = false;
  private static tasks: Map<string, cron.ScheduledTask> = new Map();

  static initialize(): void {
    if (this.initialized) return;

    logger.info('[ScheduledTasks] 初始化定时任务调度器...');

    this.scheduleDepartmentHealthCheck();
    this.scheduleFeedbackClustering();
    this.scheduleWorkOrderOverdueCheck();
    this.scheduleBehaviorDataCleanup();
    this.scheduleDailyReport();

    this.initialized = true;
    logger.info(`[ScheduledTasks] 已注册 ${this.tasks.size} 个定时任务`);
  }

  private static schedule(name: string, expression: string, fn: () => Promise<void>) {
    if (this.tasks.has(name)) {
      this.tasks.get(name)?.stop();
    }

    const task = cron.schedule(expression, async () => {
      const startTime = Date.now();
      logger.debug(`[Cron] 执行任务: ${name}`);
      try {
        await fn();
        logger.debug(`[Cron] 任务完成: ${name}，耗时 ${Date.now() - startTime}ms`);
      } catch (err) {
        logger.error(`[Cron] 任务执行失败: ${name}:`, (err as Error).message);
      }
    }, { scheduled: true, timezone: 'Asia/Shanghai' });

    this.tasks.set(name, task);
    logger.debug(`[ScheduledTasks] 注册任务: ${name} (${expression})`);
  }

  private static scheduleDepartmentHealthCheck() {
    this.schedule('department-health-check', '*/5 * * * *', async () => {
      const adapters = DepartmentAdapterManager.getAllAdapters();
      for (const adapter of adapters) {
        try { await adapter.healthCheck(); } catch (_) {}
      }
    });
  }

  private static scheduleFeedbackClustering() {
    this.schedule('feedback-clustering', '0 */2 * * *', async () => {
      const engine = (FeedbackAnalyticsEngine as any);
      const all = Array.from((engine.feedbacks as Map<string, any>).values());

      const newClusters = all.filter((f: any) => !f._clusterId).length;
      if (newClusters > 0) {
        logger.info(`[Cron:聚类] 发现${newClusters}条未聚类反馈，开始分析...`);

        const { clusterFeedbacks } = require('../../../shared/utils/feedback-analytics');
        const result = clusterFeedbacks(all, 0.6);

        for (const fb of all) {
          const match = result.find((c: any) => c.feedbackIds.includes(fb.id));
          if (match) {
            fb._clusterId = match.id;
            (engine.clusters as Map<string, any>).set(match.id, match);
          }
        }

        logger.info(`[Cron:聚类] 聚类完成，共${result.length}个聚类簇`);
      }
    });
  }

  private static scheduleWorkOrderOverdueCheck() {
    this.schedule('workorder-overdue-check', '0 9,15 * * *', async () => {
      const engine = (FeedbackAnalyticsEngine as any);
      const workOrders = Array.from((engine.workOrders as Map<string, any>).values());
      const now = Date.now();
      let overdueCount = 0;

      for (const wo of workOrders) {
        if (['pending', 'in_progress'].includes(wo.status) && new Date(wo.dueDate).getTime() < now) {
          wo.escalationLevel = Math.min(3, (wo.escalationLevel || 1) + 1);
          wo.history = wo.history || [];
          wo.history.push({
            status: wo.status,
            timestamp: new Date().toISOString(),
            note: '工单已超期，自动提升督办级别'
          });
          overdueCount++;

          auditLogger.systemEvent('workorder_overdue', {
            workOrderId: wo.id,
            escalationLevel: wo.escalationLevel
          });
        }
      }

      if (overdueCount > 0) {
        logger.warn(`[Cron:超期检查] 发现${overdueCount}张超期工单，已自动升级督办级别`);
      }
    });
  }

  private static scheduleBehaviorDataCleanup() {
    this.schedule('behavior-data-cleanup', '0 3 * * 0', async () => {
      const engine = require('../engines/ProfileEngineService').default;
      const stats = engine.getEngineStats();

      logger.info(`[Cron:清理] 行为数据清理完成，当前保留${stats.totalBehaviorRecords}条记录`);
    });
  }

  private static scheduleDailyReport() {
    this.schedule('daily-operation-report', '0 8 * * *', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const dashboard = await FeedbackAnalyticsEngine.getAnalyticsDashboard(1);

      auditLogger.systemEvent('daily_report_generated', {
        date: yesterday.toISOString().split('T')[0],
        ...dashboard.summary
      });

      logger.info(`[Cron:日报] 每日运营报告已生成:
        - 反馈数: ${dashboard.summary.totalFeedbacks}
        - 平均评分: ${dashboard.summary.avgRating}
        - 好评率: ${dashboard.summary.positiveRate}%
        - 待处理紧急工单: ${dashboard.pendingUrgentCount}
        - 超期工单: ${dashboard.overdueWorkOrderCount}`);
    });
  }

  static shutdown(): void {
    logger.info('[ScheduledTasks] 停止所有定时任务...');
    for (const [name, task] of this.tasks) {
      task.stop();
      logger.debug(`[ScheduledTasks] 已停止任务: ${name}`);
    }
    this.tasks.clear();
    this.initialized = false;
  }

  static getTaskStatus(): Record<string, { expression: string; running: boolean }> {
    const result: Record<string, any> = {};
    for (const [name, task] of this.tasks) {
      result[name] = { running: !!task };
    }
    return result;
  }
}

export default ScheduledTasks;
