import { dashboardRepository } from '../repositories/DashboardRepository.js';
import { dataAggregationService } from './DataAggregationService.js';
import type {
  Dashboard,
  DashboardWidget,
  PageResponse,
} from '../../shared/types/index.js';
import type {
  DashboardQueryParams,
  CreateDashboardData,
  UpdateDashboardData,
} from '../repositories/DashboardRepository.js';

export interface WidgetDataQuery {
  dataSource: string;
  dimensions: string[];
  measures: string[];
  filters: Record<string, any>;
}

export class DashboardService {
  async getDashboards(params: DashboardQueryParams): Promise<PageResponse<Dashboard>> {
    return dashboardRepository.findAll(params);
  }

  async getDashboardById(id: string, userId?: string, role?: string): Promise<Dashboard | null> {
    const dashboard = await dashboardRepository.findById(id);
    if (!dashboard) return null;

    if (dashboard.isPublic || dashboard.ownerId === userId) {
      return dashboard;
    }

    if (role && dashboard.sharedRoles.includes(role)) {
      return dashboard;
    }

    return null;
  }

  async createDashboard(data: CreateDashboardData): Promise<Dashboard> {
    return dashboardRepository.create(data);
  }

  async updateDashboard(id: string, data: UpdateDashboardData): Promise<Dashboard | null> {
    return dashboardRepository.update(id, data);
  }

  async deleteDashboard(id: string): Promise<boolean> {
    return dashboardRepository.delete(id);
  }

  async addWidget(dashboardId: string, widget: DashboardWidget): Promise<Dashboard | null> {
    return dashboardRepository.addWidget(dashboardId, widget);
  }

  async updateWidget(dashboardId: string, widgetId: string, widget: Partial<DashboardWidget>): Promise<Dashboard | null> {
    return dashboardRepository.updateWidget(dashboardId, widgetId, widget);
  }

  async removeWidget(dashboardId: string, widgetId: string): Promise<Dashboard | null> {
    return dashboardRepository.removeWidget(dashboardId, widgetId);
  }

  async getWidgetData(widget: WidgetDataQuery): Promise<any> {
    const { dataSource, dimensions, measures, filters } = widget;

    switch (dataSource) {
      case 'scenic_flow':
        return this.getScenicFlowData(dimensions, measures, filters);
      case 'ota_booking':
        return this.getOTABookingData(dimensions, measures, filters);
      case 'intangible_heritage':
        return this.getHeritageData(dimensions, measures, filters);
      case 'coupon_consumption':
        return this.getCouponData(dimensions, measures, filters);
      case 'overview_stats':
        return this.getOverviewData();
      default:
        throw new Error(`Unknown data source: ${dataSource}`);
    }
  }

  async getDashboardData(dashboardId: string): Promise<Record<string, any>> {
    const dashboard = await dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const widgetData: Record<string, any> = {};

    for (const widget of dashboard.layout) {
      try {
        widgetData[widget.id] = await this.getWidgetData({
          dataSource: widget.dataSource,
          dimensions: widget.dimensions,
          measures: widget.measures,
          filters: widget.filters,
        });
      } catch (error) {
        widgetData[widget.id] = { error: (error as Error).message };
      }
    }

    return widgetData;
  }

  private async getScenicFlowData(dimensions: string[], measures: string[], filters: Record<string, any>): Promise<any> {
    const hasDate = dimensions.includes('date');
    const hasRegion = dimensions.includes('region');

    if (hasDate) {
      return dataAggregationService.getFlowTrend(filters);
    }

    if (hasRegion) {
      return dataAggregationService.getRegionalFlowStats(filters);
    }

    return dataAggregationService.getScenicFlows(filters);
  }

  private async getOTABookingData(dimensions: string[], measures: string[], filters: Record<string, any>): Promise<any> {
    const hasPlatform = dimensions.includes('platform');
    const hasDate = dimensions.includes('date');
    const hasScenicSpot = dimensions.includes('scenicSpot');

    if (hasPlatform) {
      return dataAggregationService.getPlatformDistribution(filters);
    }

    if (hasDate) {
      return dataAggregationService.getOTAAggregation({
        ...filters,
        groupBy: 'date',
      });
    }

    if (hasScenicSpot) {
      return dataAggregationService.getOTAAggregation({
        ...filters,
        groupBy: 'scenicSpot',
      });
    }

    return dataAggregationService.getOTABookings(filters);
  }

  private async getHeritageData(dimensions: string[], measures: string[], filters: Record<string, any>): Promise<any> {
    const hasLevel = dimensions.includes('level');
    const hasCategory = dimensions.includes('category');

    if (hasLevel) {
      return dataAggregationService.getHeritageLevelStats(filters);
    }

    if (hasCategory) {
      return dataAggregationService.getHeritageCategoryStats(filters);
    }

    return dataAggregationService.getHeritages(filters);
  }

  private async getCouponData(dimensions: string[], measures: string[], filters: Record<string, any>): Promise<any> {
    const hasDate = dimensions.includes('date');

    if (hasDate) {
      return dataAggregationService.getWriteOffTrend(filters);
    }

    return dataAggregationService.getCouponStatistics(filters);
  }

  private async getOverviewData(): Promise<any> {
    return dataAggregationService.getOverviewStats();
  }
}

export const dashboardService = new DashboardService();
