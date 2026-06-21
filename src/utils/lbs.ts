import type { GeoPoint, ServiceProvider, ServiceGrid } from '@/types';
import { mockProviders, mockGrids } from '@/data/mockData';

const GRID_SIZE_METERS = 500;

export const haversineDistance = (p1: GeoPoint, p2: GeoPoint): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const latLngToGridCode = (point: GeoPoint): string => {
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((point.lat * Math.PI) / 180);
  const latIdx = Math.floor((point.lat * metersPerDegLat) / GRID_SIZE_METERS);
  const lngIdx = Math.floor((point.lng * metersPerDegLng) / GRID_SIZE_METERS);
  return `G${String(latIdx % 100).padStart(2, '0')}${String(lngIdx % 100).padStart(2, '0')}`;
};

export const getGridsWithinRadius = (
  center: GeoPoint,
  radiusMeters: number
): ServiceGrid[] => {
  return mockGrids.filter(
    (g) => haversineDistance(center, g.center) <= radiusMeters
  );
};

export interface MatchResult {
  provider: ServiceProvider;
  distance: number;
  score: number;
}

export const matchProviders = (
  category: string,
  location: GeoPoint,
  radiusMeters = 3000,
  topN = 3
): MatchResult[] => {
  const nearbyGrids = getGridsWithinRadius(location, radiusMeters);
  const nearbyGridIds = new Set(nearbyGrids.map((g) => g.id));

  const candidates = mockProviders.filter((p) => {
    if (!nearbyGridIds.has(p.gridId)) return false;
    if (category && category !== '全部') {
      const catMap: Record<string, string[]> = {
        家电清洗: ['家政', '保洁', '维修'],
        家政: ['家政'],
        维修: ['维修'],
        餐饮: ['餐饮'],
        快递: ['快递'],
        保洁: ['保洁'],
        搬家: ['搬家'],
        美容: ['美容'],
        教育: ['教育'],
      };
      const allowed = catMap[category] || [category];
      if (!allowed.includes(p.category)) return false;
    }
    const dist = haversineDistance(location, p.location);
    return dist <= radiusMeters;
  });

  const scored = candidates.map((p) => {
    const distance = haversineDistance(location, p.location);
    const starScore = (p.starLevel / 5) * 40;
    const rateScore = p.goodRate * 30;
    const speedScore = Math.max(0, (60 - p.responseSpeed) / 60) * 20;
    const distScore = Math.max(0, (radiusMeters - distance) / radiusMeters) * 10;
    const score = starScore + rateScore + speedScore + distScore;
    return { provider: p, distance, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatMoney = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const generateId = (prefix = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};
