import { get } from '../api';
import type { TeamFissionNode, SalesAnalysisData, MarketSaturationData } from '../../../shared/types';

export async function getTeamFission() {
  return get<TeamFissionNode>('/analytics/team/fission');
}

export async function getSalesAnalysis(params?: { period?: string }) {
  return get<SalesAnalysisData>('/analytics/sales/analysis', params);
}

export async function getSalesTrend(params?: { days?: number }) {
  return get<{ date: string; sales: number; orders: number }[]>('/analytics/sales/trend', params);
}

export async function getMarketSaturation() {
  return get<MarketSaturationData>('/analytics/market/saturation');
}
