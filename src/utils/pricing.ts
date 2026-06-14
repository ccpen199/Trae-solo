import type { CargoOrder, CargoStop, PriceBreakdown } from '@/types';
import { haversine } from './format';

function calcRouteDistance(stops: CargoStop[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversine(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
  }
  return Math.max(total, 5);
}

function getAverageCongestion(stops: CargoStop[]): number {
  const base = 0.1 + Math.random() * 0.35;
  const stopFactor = Math.min(stops.length * 0.03, 0.2);
  return Math.min(base + stopFactor, 0.7);
}

function isInNightWindow(timeIso: string): boolean {
  const h = new Date(timeIso).getHours();
  return h >= 22 || h < 6;
}

export function calculatePrice(order: Partial<CargoOrder>): PriceBreakdown {
  const stops = order.stops ?? [];
  const volume = order.volume ?? 1;
  const weight = order.weight ?? 100;
  const tempControl = order.tempControl ?? 'NORMAL';
  const loadingDifficulty = order.loadingDifficulty ?? 'LOW';
  const cargoValue = order.cargoValue ?? 0;
  const insuranceEnabled = order.insurance?.enabled ?? false;
  const pickupTimeWindow = order.pickupTimeWindow ?? [new Date().toISOString(), new Date().toISOString()];

  const totalDist = calcRouteDistance(stops);

  const tempAddition =
    tempControl === 'REFRIGERATED' ? 50 : tempControl === 'FRESH' ? 30 : tempControl === 'DEEP_FREEZE' ? 80 : 0;
  const diffAddition = loadingDifficulty === 'MEDIUM' ? 20 : loadingDifficulty === 'HIGH' ? 50 : 0;

  const basePrice =
    18 +
    totalDist * 3 +
    volume * 8 +
    weight * 0.5 +
    tempAddition +
    diffAddition;

  const avgCongestion = getAverageCongestion(stops);
  const congestionPremium = +(basePrice * Math.min(avgCongestion, 0.5)).toFixed(2);

  const isNight = isInNightWindow(pickupTimeWindow[0]);
  const nightSurcharge = isNight ? +(basePrice * 0.15).toFixed(2) : 0;

  const deliveryStops = stops.filter((s) => s.type === 'DELIVERY').length;
  const multiStopRate = Math.min(Math.max(0, deliveryStops - 2) * 0.05, 0.25);
  const multiStopCoefficient = +(basePrice * multiStopRate).toFixed(2);

  const insuranceFee = insuranceEnabled ? +(cargoValue * 0.003).toFixed(2) : 0;

  const total = +(
    basePrice +
    congestionPremium +
    nightSurcharge +
    multiStopCoefficient +
    insuranceFee
  ).toFixed(2);

  return {
    basePrice: +basePrice.toFixed(2),
    congestionPremium,
    nightSurcharge,
    multiStopCoefficient,
    insuranceFee,
    total,
  };
}
