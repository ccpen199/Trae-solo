import { create } from 'zustand';
import type { OverviewMetrics, HeatmapPoint, VisitorBehavior } from '@/types';
import { getOverviewMetrics, getHeatmapData, getVisitorBehaviors } from '@/services/api';

interface AnalyticsState {
  overviewMetrics: OverviewMetrics | null;
  heatmapData: HeatmapPoint[];
  behaviors: VisitorBehavior[];
  selectedScenicId: string | null;
  dateRange: { start: string; end: string };
  loadOverview: (scenicId?: string) => void;
  loadHeatmap: (scenicId: string, date?: string) => void;
  loadBehaviors: (scenicId?: string, eventType?: string) => void;
  setSelectedScenic: (id: string | null) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  overviewMetrics: null,
  heatmapData: [],
  behaviors: [],
  selectedScenicId: null,
  dateRange: { start: '', end: '' },
  loadOverview: (scenicId) => {
    const metrics = getOverviewMetrics(scenicId);
    set({ overviewMetrics: metrics });
  },
  loadHeatmap: (scenicId, date) => {
    const data = getHeatmapData(scenicId, date);
    set({ heatmapData: data });
  },
  loadBehaviors: (scenicId, eventType) => {
    const data = getVisitorBehaviors(scenicId, eventType);
    set({ behaviors: data });
  },
  setSelectedScenic: (id) => {
    set({ selectedScenicId: id });
  },
}));
