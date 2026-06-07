import { User } from '../models/User';
import { calculateDistance } from './geo';

export interface DispatchCandidate {
  provider: User;
  distance: number;
  score: number;
}

export const scoreProvider = (
  provider: User,
  orderLat: number,
  orderLng: number,
  requiredSkills: number[]
): DispatchCandidate => {
  const distance = provider.latitude && provider.longitude
    ? calculateDistance(orderLat, orderLng, provider.latitude, provider.longitude)
    : 999;

  const distanceScore = Math.max(0, 100 - distance * 10);

  const ratingScore = (provider.rating || 5) * 20;

  const hasAllSkills = requiredSkills.every(skill => provider.skills?.includes(skill));
  const skillScore = hasAllSkills ? 100 : 50;

  const toolCompleteness = provider.tools?.length || 0;
  const toolScore = Math.min(100, toolCompleteness * 10);

  const orderCountScore = Math.min(100, (provider.orderCount || 0) * 2);

  const totalScore =
    distanceScore * 0.35 +
    ratingScore * 0.25 +
    skillScore * 0.2 +
    toolScore * 0.1 +
    orderCountScore * 0.1;

  return {
    provider,
    distance,
    score: totalScore,
  };
};

export const findBestProvider = (
  providers: User[],
  orderLat: number,
  orderLng: number,
  requiredSkills: number[],
  maxDistanceKm: number = 10
): DispatchCandidate | null => {
  const candidates: DispatchCandidate[] = [];

  for (const provider of providers) {
    if (!provider.latitude || !provider.longitude) continue;

    const distance = calculateDistance(
      orderLat,
      orderLng,
      provider.latitude,
      provider.longitude
    );

    if (distance > maxDistanceKm) continue;

    const candidate = scoreProvider(provider, orderLat, orderLng, requiredSkills);
    candidates.push(candidate);
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates[0] || null;
};

export const rankProviders = (
  providers: User[],
  orderLat: number,
  orderLng: number,
  requiredSkills: number[]
): DispatchCandidate[] => {
  return providers
    .map(p => scoreProvider(p, orderLat, orderLng, requiredSkills))
    .sort((a, b) => b.score - a.score);
};
