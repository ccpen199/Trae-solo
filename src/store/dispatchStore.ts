import { create } from 'zustand';
import type { HeatmapPoint, RegionSaturation } from '@/types';
import { generateHeatmapData, generateRegionSaturation } from '@/utils/mockData';

interface DispatchState {
  heatmapData: HeatmapPoint[];
  saturationRegions: RegionSaturation[];
  gmv: number;
  todayOrders: number;
  fulfillmentRate: number;
  avgDeliveryMin: number;
  emptyMileageRate: number;
  activeDrivers: number;
  pendingMatching: number;
  matchSuccessRate: number;
  matchAvgMs: number;
  init: () => void;
}

let inited = false;
export const useDispatchStore = create<DispatchState>((set) => ({
  heatmapData: [],
  saturationRegions: [],
  gmv: 0,
  todayOrders: 0,
  fulfillmentRate: 0,
  avgDeliveryMin: 0,
  emptyMileageRate: 0,
  activeDrivers: 0,
  pendingMatching: 0,
  matchSuccessRate: 0,
  matchAvgMs: 0,
  init: () => {
    if (inited) return;
    set({
      heatmapData: generateHeatmapData(),
      saturationRegions: generateRegionSaturation(),
      gmv: 286543.25,
      todayOrders: 482,
      fulfillmentRate: 0.968,
      avgDeliveryMin: 62,
      emptyMileageRate: 0.183,
      activeDrivers: 128,
      pendingMatching: 23,
      matchSuccessRate: 0.982,
      matchAvgMs: 1420,
    });
    inited = true;
    setInterval(() => {
      set((s) => ({
        gmv: s.gmv + Math.random() * 80,
        todayOrders: s.todayOrders + (Math.random() < 0.3 ? 1 : 0),
        pendingMatching: Math.max(5, s.pendingMatching + randInt(-1, 2)),
        matchAvgMs: 1200 + Math.random() * 500,
      }));
    }, 3000);
  },
}));

function randInt(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
