const EARTH_RADIUS_KM = 6371;

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  }
  return `${Math.round(distanceKm)}km`;
}

export function getBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): BoundingBox {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const latRad = toRad(lat);
  const lngRad = toRad(lng);

  const radiusRad = radiusKm / EARTH_RADIUS_KM;

  const minLat = latRad - radiusRad;
  const maxLat = latRad + radiusRad;

  const deltaLng = Math.asin(Math.sin(radiusRad) / Math.cos(latRad));
  const minLng = lngRad - deltaLng;
  const maxLng = lngRad + deltaLng;

  return {
    minLat: toDeg(minLat),
    maxLat: toDeg(maxLat),
    minLng: toDeg(minLng),
    maxLng: toDeg(maxLng),
  };
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function isPointInBoundingBox(
  lat: number,
  lng: number,
  boundingBox: BoundingBox
): boolean {
  if (!isValidCoordinate(lat, lng)) return false;
  return (
    lat >= boundingBox.minLat &&
    lat <= boundingBox.maxLat &&
    lng >= boundingBox.minLng &&
    lng <= boundingBox.maxLng
  );
}
