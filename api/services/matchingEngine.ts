import type {
  User,
  DriverProfile,
  FreightOrder,
  MatchResult,
  MatchingConfig,
  AddressPoint,
} from '../../shared/types';
import { haversineDistance, encode } from '../utils/geohash';
import { v4 as uuidv4 } from '../utils/uuid';

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  priceWeight: 0.35,
  creditWeight: 0.25,
  qualificationWeight: 0.25,
  routeWeight: 0.15,
  topN: 5,
  minCreditScore: 600,
  maxPriceDeviationPercent: 15,
};

interface MatchCandidate {
  user: User;
  profile: DriverProfile;
  currentLocation?: AddressPoint;
  expectedPrice?: number;
}

export function calculatePriceScore(
  order: FreightOrder,
  candidateExpectedPrice: number,
  maxDeviationPercent: number,
): number {
  const expected = order.freightAmount;
  const deviation = Math.abs(candidateExpectedPrice - expected) / expected;
  const maxDeviation = maxDeviationPercent / 100;

  if (candidateExpectedPrice <= expected) {
    return 100;
  }
  if (deviation >= maxDeviation) {
    return 0;
  }
  return Math.round(100 * (1 - deviation / maxDeviation));
}

export function calculateCreditScore(candidate: User, minCreditScore: number): number {
  const score = candidate.creditScore;
  if (score >= 800) return 100;
  if (score >= 750) return 90;
  if (score >= 700) return 75;
  if (score >= 650) return 60;
  if (score >= minCreditScore) return 40;
  return 0;
}

export function calculateQualificationScore(
  order: FreightOrder,
  profile: DriverProfile,
): { score: number; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];

  const requiredType = order.vehicleTypeRequired;
  if (profile.vehicleType !== requiredType) {
    const typeCapacityMap: Record<string, number> = {
      truck_4_2: 1,
      truck_6_8: 2,
      truck_9_6: 3,
      truck_13: 4,
      truck_17_5: 5,
    };
    const requiredCap = typeCapacityMap[requiredType] ?? 3;
    const actualCap = typeCapacityMap[profile.vehicleType] ?? 3;

    if (actualCap < requiredCap) {
      score -= 60;
      reasons.push('车型规格不满足要求');
    } else if (actualCap === requiredCap) {
      reasons.push('车型规格完全匹配');
    } else {
      score -= 10;
      reasons.push('车型规格高于要求');
    }
  } else {
    reasons.push('车型规格完全匹配');
  }

  if (profile.vehicleWeight < order.cargoWeight) {
    score -= 30;
    reasons.push('载重能力不足');
  } else if (profile.vehicleWeight >= order.cargoWeight * 1.2) {
    reasons.push('载重能力充足');
  } else {
    reasons.push('载重能力刚好满足');
  }

  if (profile.vehicleVolume < order.cargoVolume) {
    score -= 20;
    reasons.push('容积不足');
  } else {
    reasons.push('容积满足要求');
  }

  const completionRate =
    profile.totalOrders > 0 ? profile.completedOrders / profile.totalOrders : 0;
  if (completionRate >= 0.95) {
    score += 0;
    reasons.push(`历史完成率${(completionRate * 100).toFixed(1)}%优秀`);
  } else if (completionRate >= 0.9) {
    score -= 5;
    reasons.push(`历史完成率${(completionRate * 100).toFixed(1)}%良好`);
  } else if (completionRate >= 0.85) {
    score -= 10;
    reasons.push(`历史完成率${(completionRate * 100).toFixed(1)}%一般`);
  } else {
    score -= 20;
    reasons.push(`历史完成率${(completionRate * 100).toFixed(1)}%偏低`);
  }

  if (profile.rating >= 4.8) {
    reasons.push(`用户评分${profile.rating}分优秀`);
  } else if (profile.rating >= 4.5) {
    score -= 3;
    reasons.push(`用户评分${profile.rating}分良好`);
  } else {
    score -= 8;
    reasons.push(`用户评分${profile.rating}分`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
  };
}

export function calculateRouteScore(
  order: FreightOrder,
  profile: DriverProfile,
  currentLocation?: AddressPoint,
): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  const pickupCity = order.pickupPoint.city;
  const deliveryCity = order.deliveryPoint.city;
  const routeName = `${pickupCity}→${deliveryCity}`;

  const preferredRouteMatch = profile.preferredRoutes.some((r) => {
    return r.includes(pickupCity) || r.includes(deliveryCity) || routeName.includes(r);
  });

  if (preferredRouteMatch) {
    score += 20;
    reasons.push('匹配偏好线路');
  } else {
    reasons.push('非偏好线路');
  }

  const preferredCargoMatch = profile.preferredCargoTypes.includes(order.cargoType);
  if (preferredCargoMatch) {
    score += 10;
    reasons.push('匹配偏好货物类型');
  } else {
    score -= 5;
    reasons.push('非偏好货物类型');
  }

  if (currentLocation) {
    const distanceToPickup = haversineDistance(
      { longitude: currentLocation.longitude, latitude: currentLocation.latitude },
      { longitude: order.pickupPoint.longitude, latitude: order.pickupPoint.latitude },
      'km',
    );

    if (distanceToPickup <= 50) {
      score += 20;
      reasons.push(`距装货点${distanceToPickup.toFixed(1)}km，位置极佳`);
    } else if (distanceToPickup <= 100) {
      score += 15;
      reasons.push(`距装货点${distanceToPickup.toFixed(1)}km，位置良好`);
    } else if (distanceToPickup <= 200) {
      score += 8;
      reasons.push(`距装货点${distanceToPickup.toFixed(1)}km，位置一般`);
    } else if (distanceToPickup <= 500) {
      score -= 5;
      reasons.push(`距装货点${distanceToPickup.toFixed(1)}km，较远`);
    } else {
      score -= 15;
      reasons.push(`距装货点${distanceToPickup.toFixed(1)}km，过远`);
    }
  } else {
    score += 5;
    reasons.push('当前位置未知');
  }

  const homeDistance = haversineDistance(
    {
      longitude: profile.homeAddress.longitude,
      latitude: profile.homeAddress.latitude,
    },
    { longitude: order.deliveryPoint.longitude, latitude: order.deliveryPoint.latitude },
    'km',
  );

  if (homeDistance <= 150) {
    score += 10;
    reasons.push(`卸货点距常驻地${homeDistance.toFixed(0)}km，返程便利`);
  } else if (homeDistance <= 300) {
    score += 5;
    reasons.push(`卸货点距常驻地${homeDistance.toFixed(0)}km，返程较近`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
  };
}

export function estimateDriverExpectedPrice(order: FreightOrder, profile: DriverProfile): number {
  const basePrice = order.freightAmount;
  const distance = order.distanceKm;

  let multiplier = 1.0;

  const typeCapacityMap: Record<string, number> = {
    truck_4_2: 0.9,
    truck_6_8: 1.0,
    truck_9_6: 1.1,
    truck_13: 1.25,
    truck_17_5: 1.4,
  };
  multiplier *= typeCapacityMap[profile.vehicleType] ?? 1.1;

  const completionRate =
    profile.totalOrders > 0 ? profile.completedOrders / profile.totalOrders : 0.85;
  if (completionRate >= 0.95) {
    multiplier *= 1.05;
  } else if (completionRate < 0.85) {
    multiplier *= 0.95;
  }

  if (distance > 1000) {
    multiplier *= 0.95;
  } else if (distance < 300) {
    multiplier *= 1.08;
  }

  return Math.round(basePrice * multiplier * 100) / 100;
}

export interface MatchResultDetail extends MatchResult {
  driverName: string;
  vehiclePlateNo: string;
  vehicleType: string;
  rating: number;
  completionRate: number;
  qualificationReasons: string[];
  routeReasons: string[];
  distanceToPickup?: number;
  expectedPrice: number;
}

export function matchDriversForOrder(
  order: FreightOrder,
  candidates: MatchCandidate[],
  config: Partial<MatchingConfig> = {},
): MatchResultDetail[] {
  const fullConfig: MatchingConfig = { ...DEFAULT_MATCHING_CONFIG, ...config };

  const results: MatchResultDetail[] = [];

  for (const candidate of candidates) {
    if (candidate.user.creditScore < fullConfig.minCreditScore) {
      continue;
    }

    const expectedPrice = candidate.expectedPrice ?? estimateDriverExpectedPrice(order, candidate.profile);

    const priceScore = calculatePriceScore(order, expectedPrice, fullConfig.maxPriceDeviationPercent);
    if (priceScore === 0) {
      continue;
    }

    const creditScore = calculateCreditScore(candidate.user, fullConfig.minCreditScore);
    const { score: qualificationScore, reasons: qualificationReasons } = calculateQualificationScore(order, candidate.profile);
    if (qualificationScore < 30) {
      continue;
    }

    const { score: routeScore, reasons: routeReasons } = calculateRouteScore(
      order,
      candidate.profile,
      candidate.currentLocation,
    );

    const totalScore =
      priceScore * fullConfig.priceWeight +
      creditScore * fullConfig.creditWeight +
      qualificationScore * fullConfig.qualificationWeight +
      routeScore * fullConfig.routeWeight;

    let distanceToPickup: number | undefined;
    if (candidate.currentLocation) {
      distanceToPickup = haversineDistance(
        {
          longitude: candidate.currentLocation.longitude,
          latitude: candidate.currentLocation.latitude,
        },
        { longitude: order.pickupPoint.longitude, latitude: order.pickupPoint.latitude },
        'km',
      );
    }

    const completionRate =
      candidate.profile.totalOrders > 0
        ? candidate.profile.completedOrders / candidate.profile.totalOrders
        : 0;

    results.push({
      orderId: order.id,
      driverId: candidate.user.id,
      score: Math.round(totalScore * 100) / 100,
      priceScore,
      creditScore,
      qualificationScore,
      routeScore,
      recommendedAt: new Date().toISOString(),
      driverName: candidate.user.realName || candidate.user.nickname,
      vehiclePlateNo: candidate.profile.vehiclePlateNo,
      vehicleType: candidate.profile.vehicleType,
      rating: candidate.profile.rating,
      completionRate: Math.round(completionRate * 10000) / 10000,
      qualificationReasons,
      routeReasons,
      distanceToPickup,
      expectedPrice,
    });
  }

  results.sort((a, b) => b.score - a.score);

  return results.slice(0, fullConfig.topN);
}

export function createMatchResult(
  orderId: string,
  driverId: string,
  scores: {
    priceScore: number;
    creditScore: number;
    qualificationScore: number;
    routeScore: number;
  },
  weights: MatchingConfig = DEFAULT_MATCHING_CONFIG,
): MatchResult {
  const score =
    scores.priceScore * weights.priceWeight +
    scores.creditScore * weights.creditWeight +
    scores.qualificationScore * weights.qualificationWeight +
    scores.routeScore * weights.routeWeight;

  return {
    orderId,
    driverId,
    score: Math.round(score * 100) / 100,
    ...scores,
    recommendedAt: new Date().toISOString(),
  };
}

export function enrichOrderWithGeohash(order: FreightOrder): FreightOrder {
  return {
    ...order,
    pickupPoint: {
      ...order.pickupPoint,
      geohash: encode(order.pickupPoint.longitude, order.pickupPoint.latitude, 7),
    },
    deliveryPoint: {
      ...order.deliveryPoint,
      geohash: encode(order.deliveryPoint.longitude, order.deliveryPoint.latitude, 7),
    },
  };
}

export interface DriverRecommendCandidate {
  user: User;
  profile: DriverProfile;
  expectedPrice?: number;
  currentLocation?: { longitude: number; latitude: number };
}

export interface OrderRecommendResult {
  order: FreightOrder;
  shipper?: User;
  score: number;
  priceScore: number;
  creditScore: number;
  qualificationScore: number;
  routeScore: number;
  expectedPrice: number;
  recommendedAt: string;
}

export function recommendDriversForOrder(
  order: FreightOrder,
  candidates: DriverRecommendCandidate[],
  config: Partial<MatchingConfig> = {},
): MatchResultDetail[] {
  const matchCandidates: MatchCandidate[] = candidates.map(c => ({
    user: c.user,
    profile: c.profile,
    expectedPrice: c.expectedPrice,
    currentLocation: c.currentLocation,
  }));
  return matchDriversForOrder(order, matchCandidates, config);
}

export function recommendOrdersForDriver(
  driver: User,
  driverProfile: DriverProfile,
  orders: FreightOrder[],
  shippers: User[],
  _shipperProfiles: ShipperProfile[],
  currentLocation: { lng: number; lat: number },
  filters: { vehicleType?: string; minFreight?: number; cargoType?: string; radiusKm?: number },
  config: Partial<MatchingConfig> = {},
): OrderRecommendResult[] {
  const fullConfig: MatchingConfig = { ...DEFAULT_MATCHING_CONFIG, ...config };
  const radiusKm = filters.radiusKm ?? 300;
  const results: OrderRecommendResult[] = [];

  for (const order of orders) {
    if (order.status !== 'published') continue;
    if (filters.minFreight && order.freightAmount < filters.minFreight) continue;
    if (filters.cargoType && !order.cargoType?.includes(filters.cargoType)) continue;
    if (filters.vehicleType && order.vehicleTypeRequired !== filters.vehicleType) continue;

    const pickupDist = haversineDistance(
      { longitude: currentLocation.lng, latitude: currentLocation.lat },
      { longitude: order.pickupPoint.longitude, latitude: order.pickupPoint.latitude },
      'km',
    );
    if (pickupDist > radiusKm) continue;

    const expectedPrice = estimateDriverExpectedPrice(order, driverProfile);
    const priceScore = calculatePriceScore(order, expectedPrice, fullConfig.maxPriceDeviationPercent);
    const creditScore = calculateCreditScore(driver, fullConfig.minCreditScore);
    const { score: qualificationScore } = calculateQualificationScore(order, driverProfile);
    if (qualificationScore < 30) continue;

    const { score: routeScore } = calculateRouteScore(
      order,
      driverProfile,
      { longitude: currentLocation.lng, latitude: currentLocation.lat },
    );

    const score =
      priceScore * fullConfig.priceWeight +
      creditScore * fullConfig.creditWeight +
      qualificationScore * fullConfig.qualificationWeight +
      routeScore * fullConfig.routeWeight;

    const shipper = shippers.find(s => s.id === order.shipperId);

    results.push({
      order,
      shipper,
      score: Math.round(score * 100) / 100,
      priceScore: Math.round(priceScore * 100) / 100,
      creditScore: Math.round(creditScore * 100) / 100,
      qualificationScore: Math.round(qualificationScore * 100) / 100,
      routeScore: Math.round(routeScore * 100) / 100,
      expectedPrice: Math.round(expectedPrice),
      recommendedAt: new Date().toISOString(),
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
