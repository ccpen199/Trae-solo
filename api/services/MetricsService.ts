import { MetricsRepository } from '../repositories/MetricsRepository.js';
import { MetricsOverview, BottleneckNode } from '../types/index.js';

const metricsRepository = new MetricsRepository();

export class MetricsService {
  getOverview(): MetricsOverview {
    return metricsRepository.getOverview();
  }

  getBottleneckNodes(): BottleneckNode[] {
    return metricsRepository.getBottleneckNodes();
  }

  getDailyTrend(days: number = 7) {
    return metricsRepository.getDailyTrend(days);
  }

  getDepartmentStats() {
    return metricsRepository.getDepartmentStats();
  }
}
