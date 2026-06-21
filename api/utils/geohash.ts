const BASE32_CHARS = '0123456789bcdefghjkmnpqrstuvwxyz';
const BASE32_MAP: Record<string, number> = {};
for (let i = 0; i < BASE32_CHARS.length; i++) {
  BASE32_MAP[BASE32_CHARS[i]] = i;
}

const EARTH_RADIUS_KM = 6371.0088;

export interface Coordinate {
  longitude: number;
  latitude: number;
}

export interface GeohashBounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

export interface DecodedGeohash {
  longitude: number;
  latitude: number;
  bounds: GeohashBounds;
  error: {
    lng: number;
    lat: number;
  };
}

export function encode(longitude: number, latitude: number, precision = 7): string {
  if (precision < 1 || precision > 12) {
    throw new Error('Precision must be between 1 and 12');
  }
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new Error('Invalid coordinates');
  }

  let geohash = '';
  let bits = 0;
  let totalBits = 0;
  let hashValue = 0;
  let isEven = true;
  let minLng = -180;
  let maxLng = 180;
  let minLat = -90;
  let maxLat = 90;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2;
      if (longitude >= mid) {
        hashValue = (hashValue << 1) | 1;
        minLng = mid;
      } else {
        hashValue = (hashValue << 1) | 0;
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (latitude >= mid) {
        hashValue = (hashValue << 1) | 1;
        minLat = mid;
      } else {
        hashValue = (hashValue << 1) | 0;
        maxLat = mid;
      }
    }

    isEven = !isEven;
    bits++;

    if (bits === 5) {
      geohash += BASE32_CHARS[hashValue];
      bits = 0;
      hashValue = 0;
      totalBits += 5;
    }
  }

  return geohash;
}

export function decode(geohash: string): DecodedGeohash {
  if (!geohash || geohash.length === 0) {
    throw new Error('Invalid geohash');
  }

  const lower = geohash.toLowerCase();
  for (const ch of lower) {
    if (!BASE32_MAP.hasOwnProperty(ch)) {
      throw new Error(`Invalid geohash character: ${ch}`);
    }
  }

  let isEven = true;
  let minLng = -180;
  let maxLng = 180;
  let minLat = -90;
  let maxLat = 90;
  let latErr = 90;
  let lngErr = 180;

  for (const ch of lower) {
    const cd = BASE32_MAP[ch];
    for (let j = 0; j < 5; j++) {
      const mask = 1 << (4 - j);
      if (isEven) {
        lngErr /= 2;
        const mid = (minLng + maxLng) / 2;
        if (cd & mask) {
          minLng = mid;
        } else {
          maxLng = mid;
        }
      } else {
        latErr /= 2;
        const mid = (minLat + maxLat) / 2;
        if (cd & mask) {
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      isEven = !isEven;
    }
  }

  const longitude = (minLng + maxLng) / 2;
  const latitude = (minLat + maxLat) / 2;

  return {
    longitude,
    latitude,
    bounds: {
      minLng,
      maxLng,
      minLat,
      maxLat,
    },
    error: {
      lng: lngErr,
      lat: latErr,
    },
  };
}

export function getNeighbors(geohash: string): string[] {
  if (!geohash || geohash.length === 0) {
    throw new Error('Invalid geohash');
  }

  const neighbors: string[] = [];
  const directions: Array<[number, number]> = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  const decoded = decode(geohash);
  const latDelta = decoded.error.lat * 2;
  const lngDelta = decoded.error.lng * 2;
  const precision = geohash.length;

  for (const [dx, dy] of directions) {
    const neighborLng = decoded.longitude + dx * lngDelta;
    const neighborLat = decoded.latitude + dy * latDelta;

    let finalLng = neighborLng;
    let finalLat = neighborLat;

    if (finalLng > 180) {
      finalLng = -180 + (finalLng - 180);
    } else if (finalLng < -180) {
      finalLng = 180 - (-180 - finalLng);
    }

    if (finalLat > 90) {
      finalLat = 90 - (finalLat - 90);
    } else if (finalLat < -90) {
      finalLat = -90 - (-90 - finalLat);
    }

    neighbors.push(encode(finalLng, finalLat, precision));
  }

  return neighbors;
}

export function getNeighborsWithCenter(geohash: string): string[] {
  return [geohash, ...getNeighbors(geohash)];
}

export function haversineDistance(
  coord1: Coordinate,
  coord2: Coordinate,
  unit: 'km' | 'm' | 'miles' = 'km',
): number {
  const { longitude: lng1, latitude: lat1 } = coord1;
  const { longitude: lng2, latitude: lat2 } = coord2;

  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  let distance = EARTH_RADIUS_KM * c;

  switch (unit) {
    case 'm':
      return distance * 1000;
    case 'miles':
      return distance * 0.621371;
    case 'km':
    default:
      return distance;
  }
}

export interface PointWithDistance<T> {
  point: T;
  distance: number;
}

export function findNearby<T>(
  center: Coordinate,
  points: T[],
  getCoordinate: (p: T) => Coordinate,
  maxDistanceKm: number,
  maxResults?: number,
): PointWithDistance<T>[] {
  const results: PointWithDistance<T>[] = [];

  for (const point of points) {
    const coord = getCoordinate(point);
    const distance = haversineDistance(center, coord, 'km');
    if (distance <= maxDistanceKm) {
      results.push({ point, distance });
    }
  }

  results.sort((a, b) => a.distance - b.distance);

  if (maxResults && maxResults > 0) {
    return results.slice(0, maxResults);
  }

  return results;
}

export function searchByGeohash<T>(
  center: Coordinate,
  items: T[],
  getGeohash: (item: T) => string | undefined,
  getCoordinate: (item: T) => Coordinate,
  searchPrecision = 5,
  maxDistanceKm?: number,
  maxResults?: number,
): PointWithDistance<T>[] {
  const centerGeohash = encode(center.longitude, center.latitude, searchPrecision);
  const searchHashes = new Set(getNeighborsWithCenter(centerGeohash));

  const candidates: T[] = [];
  for (const item of items) {
    const itemGeohash = getGeohash(item);
    if (itemGeohash && itemGeohash.length >= searchPrecision) {
      const itemPrefix = itemGeohash.substring(0, searchPrecision);
      if (searchHashes.has(itemPrefix)) {
        candidates.push(item);
      }
    }
  }

  return findNearby(center, candidates, getCoordinate, maxDistanceKm ?? Infinity, maxResults);
}

export function getPrecisionForDistance(distanceKm: number): number {
  if (distanceKm >= 5000) return 1;
  if (distanceKm >= 1250) return 2;
  if (distanceKm >= 156) return 3;
  if (distanceKm >= 39) return 4;
  if (distanceKm >= 4.9) return 5;
  if (distanceKm >= 1.2) return 6;
  if (distanceKm >= 0.152) return 7;
  if (distanceKm >= 0.038) return 8;
  if (distanceKm >= 0.0048) return 9;
  if (distanceKm >= 0.0012) return 10;
  if (distanceKm >= 0.00015) return 11;
  return 12;
}
