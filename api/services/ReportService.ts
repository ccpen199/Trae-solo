import db from '../db/connection.js';
import { ActivityRepository } from '../repositories/ActivityRepository.js';
import { ParticipationRepository } from '../repositories/ParticipationRepository.js';
import { LotteryRepository } from '../repositories/LotteryRepository.js';
import { WinnerRepository } from '../repositories/WinnerRepository.js';
import type { ReportSummary } from '../../shared/types.js';

export class ReportService {
  private activityRepo: ActivityRepository;
  private participationRepo: ParticipationRepository;
  private lotteryRepo: LotteryRepository;
  private winnerRepo: WinnerRepository;

  constructor() {
    this.activityRepo = new ActivityRepository();
    this.participationRepo = new ParticipationRepository();
    this.lotteryRepo = new LotteryRepository();
    this.winnerRepo = new WinnerRepository();
  }

  getActivityReport(activityId: number): ReportSummary | null {
    const activity = this.activityRepo.findById(activityId);
    if (!activity) return null;

    const participationStats = this.participationRepo.countByActivity(activityId);
    const lotteryStats = this.lotteryRepo.countByActivity(activityId);
    const winnerStats = this.winnerRepo.countByActivity(activityId);

    const costRow = db.prepare(`
      SELECT COALESCE(SUM(p.value), 0) as total_cost
      FROM winners w
      LEFT JOIN prizes p ON w.prize_id = p.id
      WHERE w.activity_id = ? AND w.status != 'cancelled'
    `).get(activityId) as { total_cost: number };

    const totalParticipants = participationStats.total;
    const uniqueUsers = participationStats.uniqueUsers;
    const drawCount = lotteryStats.total;
    const totalWinCount = lotteryStats.winCount;
    const totalCost = costRow.total_cost || 0;

    const conversionRate = uniqueUsers > 0 ? drawCount / uniqueUsers : 0;
    const winRate = drawCount > 0 ? totalWinCount / drawCount : 0;
    const distributionRate = winnerStats.total > 0 ? winnerStats.distributed / winnerStats.total : 0;

    return {
      activityId,
      activityName: activity.name,
      totalParticipants,
      uniqueUsers,
      drawCount,
      conversionRate: Math.round(conversionRate * 10000) / 100,
      totalWinCount,
      winRate: Math.round(winRate * 10000) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      distributionRate: Math.round(distributionRate * 10000) / 100,
      complaintCount: 0
    };
  }

  getAllReports(): ReportSummary[] {
    const activities = this.activityRepo.findAll();
    return activities
      .map(activity => this.getActivityReport(activity.id))
      .filter((report): report is ReportSummary => report !== null);
  }

  getDashboardSummary() {
    const totalActivities = this.activityRepo.findAll().length;
    const publishedActivities = this.activityRepo.findByStatus('published').length;
    
    const allActivities = this.activityRepo.findAll();
    let totalParticipants = 0;
    let totalUniqueUsers = 0;
    let totalDrawCount = 0;
    let totalWinCount = 0;
    let totalCost = 0;

    for (const activity of allActivities) {
      const report = this.getActivityReport(activity.id);
      if (report) {
        totalParticipants += report.totalParticipants;
        totalUniqueUsers += report.uniqueUsers;
        totalDrawCount += report.drawCount;
        totalWinCount += report.totalWinCount;
        totalCost += report.totalCost;
      }
    }

    const pendingWinners = db.prepare(`
      SELECT COUNT(*) as count FROM winners WHERE status = 'pending'
    `).get() as { count: number };

    const pendingRisk = db.prepare(`
      SELECT COUNT(*) as count FROM risk_items WHERE status = 'pending'
    `).get() as { count: number };

    return {
      totalActivities,
      publishedActivities,
      totalParticipants,
      totalUniqueUsers,
      totalDrawCount,
      totalWinCount,
      totalCost: Math.round(totalCost * 100) / 100,
      pendingWinners: pendingWinners.count,
      pendingRisk: pendingRisk.count,
      overallWinRate: totalDrawCount > 0 ? Math.round((totalWinCount / totalDrawCount) * 10000) / 100 : 0
    };
  }

  getTrendData(activityId?: number, days: number = 7) {
    const dateCondition = activityId ? 'AND activity_id = ?' : '';
    const params: unknown[] = [];
    if (activityId) params.push(activityId);

    const data = db.prepare(`
      SELECT 
        DATE(draw_time) as date,
        COUNT(*) as draw_count,
        SUM(CASE WHEN is_win = 1 AND risk_status != 'rejected' THEN 1 ELSE 0 END) as win_count
      FROM lottery_records
      WHERE draw_time >= DATE('now', '-' || ? || ' days')
      ${dateCondition}
      GROUP BY DATE(draw_time)
      ORDER BY date DESC
    `).all(days, ...params) as Array<{ date: string; draw_count: number; win_count: number }>;

    return data.map(d => ({
      date: d.date,
      drawCount: d.draw_count,
      winCount: d.win_count,
      winRate: d.draw_count > 0 ? Math.round((d.win_count / d.draw_count) * 10000) / 100 : 0
    }));
  }

  getPrizeDistribution(activityId?: number) {
    const condition = activityId ? 'WHERE w.activity_id = ?' : '';
    const params = activityId ? [activityId] : [];

    const data = db.prepare(`
      SELECT 
        p.type,
        p.name,
        COUNT(*) as count,
        SUM(p.value) as total_value
      FROM winners w
      LEFT JOIN prizes p ON w.prize_id = p.id
      ${condition}
      AND w.status != 'cancelled'
      GROUP BY p.id
      ORDER BY count DESC
    `).all(...params) as Array<{ type: string; name: string; count: number; total_value: number }>;

    return data.map(d => ({
      type: d.type,
      name: d.name,
      count: d.count,
      totalValue: Math.round(d.total_value * 100) / 100
    }));
  }

  getChannelDistribution(activityId?: number) {
    const condition = activityId ? 'WHERE activity_id = ?' : '';
    const params = activityId ? [activityId] : [];

    const data = db.prepare(`
      SELECT 
        channel,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM participations
      ${condition}
      GROUP BY channel
      ORDER BY count DESC
    `).all(...params) as Array<{ channel: string; count: number; unique_users: number }>;

    return data.map(d => ({
      channel: d.channel,
      count: d.count,
      uniqueUsers: d.unique_users
    }));
  }

  exportReport(activityId?: number): string {
    const reports = activityId 
      ? [this.getActivityReport(activityId)].filter((r): r is ReportSummary => r !== null)
      : this.getAllReports();

    const headers = ['活动ID', '活动名称', '参与人次', '独立用户', '抽奖次数', '转化率(%)', '中奖次数', '中奖率(%)', '总成本(元)', '发放率(%)'];
    const rows = reports.map(r => [
      r.activityId,
      r.activityName,
      r.totalParticipants,
      r.uniqueUsers,
      r.drawCount,
      r.conversionRate,
      r.totalWinCount,
      r.winRate,
      r.totalCost,
      r.distributionRate
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return csv;
  }
}
