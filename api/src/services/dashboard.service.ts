import { DashboardRepository } from '../repositories/dashboard.repository';
import type { DashboardSummary, TrendPoint, AssetStructureItem, MonthlyReview } from '@shared/types';

export class DashboardService {
  private dashboardRepository = new DashboardRepository();

  getSummary(userId: number): DashboardSummary {
    return this.dashboardRepository.getSummary(userId);
  }

  getTrend(userId: number, months?: number): TrendPoint[] {
    return this.dashboardRepository.getTrend(userId, months);
  }

  getStructure(userId: number): AssetStructureItem[] {
    return this.dashboardRepository.getStructure(userId);
  }

  getMonthlyReview(userId: number, year: number, month: number): MonthlyReview {
    return this.dashboardRepository.getMonthlyReview(userId, year, month);
  }

  getAdminStats() {
    return this.dashboardRepository.getAdminStats();
  }

  getOperationLogs(page?: number, pageSize?: number) {
    return this.dashboardRepository.getOperationLogs(page, pageSize);
  }
}
