import type { GeoLocation, GeofenceArea } from '../../../shared/types/index.js'

export const calculateDistance = (loc1: GeoLocation, loc2: GeoLocation): number => {
  const R = 6371
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const isPointInCircle = (point: GeoLocation, center: GeoLocation, radius: number): boolean => {
  const distance = calculateDistance(point, center)
  return distance <= radius
}

export const isPointInPolygon = (point: GeoLocation, polygon: GeoLocation[]): boolean => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude, yi = polygon[i].longitude
    const xj = polygon[j].latitude, yj = polygon[j].longitude
    
    if (((yi > point.longitude) !== (yj > point.longitude)) &&
      (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

export const isPointInGeofence = (point: GeoLocation, geofence: GeofenceArea): boolean => {
  if (geofence.type === 'circle' && geofence.center && geofence.radius) {
    return isPointInCircle(point, geofence.center, geofence.radius)
  }
  if (geofence.type === 'polygon' && geofence.coordinates) {
    return isPointInPolygon(point, geofence.coordinates)
  }
  if (geofence.type === 'district' && geofence.districtCode) {
    return true
  }
  return false
}

export const isPointInAnyGeofence = (point: GeoLocation, geofences: GeofenceArea[]): boolean => {
  return geofences.some(geofence => isPointInGeofence(point, geofence))
}

export const generateRandomLocation = (baseLat: number = 41.8057, baseLng: number = 123.4315, radius: number = 10): GeoLocation => {
  const angle = Math.random() * 2 * Math.PI
  const distance = Math.random() * radius
  const latOffset = distance / 111 * Math.cos(angle)
  const lngOffset = distance / 111 * Math.sin(angle) / Math.cos(baseLat * Math.PI / 180)
  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset,
    address: '沈阳市随机位置',
  }
}
