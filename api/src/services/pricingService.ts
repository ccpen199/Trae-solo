import type { PricingModel, Cargo } from "../../../shared/types";

export function calculateReferencePrice(
  cargo: Cargo,
  pricingModels: PricingModel[]
): number {
  const matchedModel = pricingModels.find(
    (pm) =>
      cargo.origin.includes(pm.route.origin.substring(0, 2)) &&
      cargo.destination.includes(pm.route.destination.substring(0, 2))
  );

  if (matchedModel) {
    const distancePrice = cargo.distance * matchedModel.basePricePerKm;
    const weightPrice = cargo.weight * matchedModel.basePricePerTon;
    const basePrice = distancePrice + weightPrice;
    const finalPrice = basePrice * matchedModel.surgeFactor;
    return Math.round(finalPrice);
  }

  const defaultPerKm = 6.0;
  const defaultPerTon = 80;
  const defaultSurge = 1.0;
  const basePrice = cargo.distance * defaultPerKm + cargo.weight * defaultPerTon;
  return Math.round(basePrice * defaultSurge);
}

export function getPriceTrend(route: string, months: number = 6): number[] {
  const basePrice = 2000;
  const trend: number[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const variation = (Math.random() - 0.5) * 0.2;
    trend.push(Math.round(basePrice * (1 + variation)));
  }
  return trend;
}
