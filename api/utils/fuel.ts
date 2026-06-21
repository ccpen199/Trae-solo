import { db, type FreightOrder, type FuelStation, type FuelPlanSegment, type FuelType } from '../mock/data.js'
import { haversineDistance } from './geo.js'

export function findNearbyStations(
  lng: number,
  lat: number,
  radiusKm = 50,
  fuelType?: FuelType,
): (FuelStation & { distanceKm: number })[] {
  return db.fuelStations
    .filter(s => !fuelType || s.prices.some(p => p.fuelType === fuelType))
    .map(s => ({
      ...s,
      distanceKm: haversineDistance(lat, lng, s.address.latitude, s.address.longitude),
    }))
    .filter(s => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

const FUEL_CONSUMPTION = 32

export function calcOptimalFuelPlan(orderId: string): {
  totalLiters: number
  totalCost: number
  totalSaving: number
  plan: FuelPlanSegment[]
} {
  const order = db.orders.find(o => o.id === orderId)
  if (!order) {
    return { totalLiters: 0, totalCost: 0, totalSaving: 0, plan: [] }
  }

  const segmentCount = Math.max(2, Math.min(5, Math.ceil(order.distanceKm / 400)))
  const segmentDist = order.distanceKm / segmentCount
  const litersPerSegment = parseFloat(((segmentDist / 100) * FUEL_CONSUMPTION).toFixed(2))

  const segments: FuelPlanSegment[] = []
  let totalLiters = 0
  let totalCost = 0
  let totalSaving = 0

  const startLng = order.pickupPoint.longitude
  const startLat = order.pickupPoint.latitude
  const endLng = order.deliveryPoint.longitude
  const endLat = order.deliveryPoint.latitude
  const deltaLng = endLng - startLng
  const deltaLat = endLat - startLat

  const fuel: FuelType = 'diesel_0'

  for (let i = 0; i < segmentCount; i++) {
    const tMid = (i + 0.5) / segmentCount
    const segLng = startLng + deltaLng * tMid
    const segLat = startLat + deltaLat * tMid

    const tStart = i / segmentCount
    const tEnd = (i + 1) / segmentCount

    const nearby = findNearbyStations(segLng, segLat, 80, fuel)
    if (nearby.length === 0) continue

    const candidates = nearby.slice(0, 3).map(station => {
      const price = station.prices.find(p => p.fuelType === fuel)!
      const cost = Math.round(price.price * litersPerSegment * 100) / 100
      const retailCost = Math.round(price.originalPrice * litersPerSegment * 100) / 100
      const saving = Math.round((retailCost - cost) * 100) / 100
      const detour = station.distanceKm
      return { station, price, cost, saving, detour, score: cost + detour * 1.5 }
    })

    candidates.sort((a, b) => a.score - b.score)
    const chosen = candidates[0]
    if (!chosen) continue

    totalLiters = parseFloat((totalLiters + litersPerSegment).toFixed(2))
    totalCost = Math.round((totalCost + chosen.cost) * 100) / 100
    totalSaving = Math.round((totalSaving + chosen.saving) * 100) / 100

    segments.push({
      segmentIndex: i,
      startPoint: { lng: startLng + deltaLng * tStart, lat: startLat + deltaLat * tStart },
      endPoint: { lng: startLng + deltaLng * tEnd, lat: startLat + deltaLat * tEnd },
      distanceKm: Math.round(segmentDist * 10) / 10,
      stationId: chosen.station.id,
      stationName: chosen.station.name,
      fuelType: fuel,
      liters: litersPerSegment,
      unitPrice: chosen.price.price,
      cost: chosen.cost,
      saving: chosen.saving,
      detourKm: Math.round(chosen.detour * 10) / 10,
    })
  }

  return {
    totalLiters: Math.round(totalLiters * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    totalSaving: Math.round(totalSaving * 100) / 100,
    plan: segments,
  }
}
