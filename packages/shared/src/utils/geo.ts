import type { GeoPoint } from '../types/common';

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function isWithinRadius(
  center: { lat: number; lng: number },
  point: { lat: number; lng: number },
  radiusKm: number,
): boolean {
  return calculateDistance(center.lat, center.lng, point.lat, point.lng) <= radiusKm;
}

export function generateGeoPoint(lat: number, lng: number): GeoPoint {
  return {
    type: 'Point',
    coordinates: [lng, lat],
  };
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}
