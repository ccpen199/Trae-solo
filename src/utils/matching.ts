import type { CargoOrder, Driver, MatchCandidate } from '@/types';
import { haversine } from './format';

function normalize(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function getCongestionFactor(lat: number, lng: number): number {
  const hash = (Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453) % 1);
  return 0.05 + hash * 0.6;
}

function estimateETA(km: number, factor: number): number {
  const avgSpeed = 45 - factor * 30;
  return Math.max(5, Math.round((km / avgSpeed) * 60));
}

export function calculateMatchScore(order: CargoOrder, driver: Driver): MatchCandidate {
  const pickup = order.stops[0];
  const lastStop = order.stops[order.stops.length - 1];

  const distance = haversine(driver.currentLat, driver.currentLng, pickup.lat, pickup.lng);
  const congestionFactor = getCongestionFactor(driver.currentLat, driver.currentLng);
  const routeScore = normalize(100 - distance * 0.8 - congestionFactor * 25, 0, 100);

  const historyScore = driver.historyFulfillmentRate * 70 + (driver.rating / 5) * 30;

  const volumeFit = Math.min(1, driver.maxVolume / Math.max(order.volume, 0.1));
  const weightFit = Math.min(1, driver.maxWeight / Math.max(order.weight, 1));
  const tempFit =
    order.tempControl === 'NORMAL'
      ? 1
      : driver.tempCapability?.includes(order.tempControl)
        ? 1
        : 0;
  const vehicleScore = volumeFit * 40 + weightFit * 40 + tempFit * 20;

  const returnDist = haversine(driver.currentLat, driver.currentLng, lastStop.lat, lastStop.lng);
  const returnEmptyScore = normalize(100 - returnDist * 0.35, 0, 100);

  const overallScore = +(
    routeScore * 0.30 +
    historyScore * 0.25 +
    vehicleScore * 0.25 +
    returnEmptyScore * 0.20
  ).toFixed(1);

  return {
    driverId: driver.id,
    driver,
    overallScore,
    routeScore: +routeScore.toFixed(1),
    historyScore: +historyScore.toFixed(1),
    vehicleScore: +vehicleScore.toFixed(1),
    returnEmptyScore: +returnEmptyScore.toFixed(1),
    etaMinutes: estimateETA(distance, congestionFactor),
    distanceKm: +distance.toFixed(2),
  };
}

export function getTopCandidates(order: CargoOrder, allDrivers: Driver[], limit = 3): MatchCandidate[] {
  const available = allDrivers.filter(
    (d) => d.currentStatus !== 'IN_TRANSIT'
  );
  return available
    .map((d) => calculateMatchScore(order, d))
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, limit);
}
