export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateCommuteTime(
  distanceKm: number,
  trafficFactor: number = 1.0
): number {
  const avgSpeedKmh = 30;
  return (distanceKm / avgSpeedKmh) * 60 * trafficFactor;
}

export function isInRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusKm: number
): boolean {
  return calculateDistance(lat1, lng1, lat2, lng2) <= radiusKm;
}

export function generateCommutePolygon(
  centerLat: number,
  centerLng: number,
  maxTimeMinutes: number,
  points: number = 36
): Array<[number, number]> {
  const avgSpeedKmh = 30;
  const radiusKm = (maxTimeMinutes / 60) * avgSpeedKmh;
  const polygon: Array<[number, number]> = [];

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const r = radiusKm * (0.7 + Math.random() * 0.3);
    const latOffset = (r / 111) * Math.cos(angle);
    const lngOffset = (r / (111 * Math.cos((centerLat * Math.PI) / 180))) * Math.sin(angle);
    polygon.push([centerLat + latOffset, centerLng + lngOffset]);
  }

  return polygon;
}
