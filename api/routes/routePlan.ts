import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface Waypoint {
  lat: number
  lng: number
  name?: string
}

interface RouteSegment {
  from: Waypoint
  to: Waypoint
  distanceKm: number
  needCharging: boolean
  recommendedStation?: any
  estimatedSocAtArrival: number
}

router.post('/', (req: Request, res: Response): void => {
  try {
    const { origin, destinations, currentSoc, batteryCapacity, vehicleModel, sortBy = 'distance' } = req.body

    if (!origin || !destinations || currentSoc === undefined || !batteryCapacity) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const allPoints: Waypoint[] = [
      { lat: origin.lat, lng: origin.lng, name: origin.name || '出发地' },
      ...destinations.map((d: any) => ({ lat: d.lat, lng: d.lng, name: d.name || '途经点' })),
    ]

    const stations = db.prepare(`
      SELECT cs.*, o.name as operator_name,
        (SELECT MIN(price_per_kwh) FROM charging_piles WHERE station_id = cs.id AND status = '空闲') as min_price,
        (SELECT COUNT(*) FROM charging_piles WHERE station_id = cs.id AND status = '空闲') as available_fast_count
      FROM charging_stations cs
      JOIN operators o ON cs.operator_id = o.id
    `).all() as any[]

    const energyConsumptionPerKm = batteryCapacity > 70 ? 0.18 : 0.15
    const maxRange = batteryCapacity / energyConsumptionPerKm
    const safeRange = maxRange * 0.8

    let currentSocValue = currentSoc
    let remainingRange = (currentSocValue / 100) * safeRange

    const segments: RouteSegment[] = []
    const chargingStops: any[] = []
    let totalDistance = 0
    let totalCost = 0

    for (let i = 0; i < allPoints.length - 1; i++) {
      const from = allPoints[i]
      const to = allPoints[i + 1]
      const dist = haversine(from.lat, from.lng, to.lat, to.lng)
      totalDistance += dist

      const energyNeeded = dist * energyConsumptionPerKm
      const socNeeded = (energyNeeded / batteryCapacity) * 100
      const socAtArrival = currentSocValue - socNeeded

      let needCharging = socAtArrival < 15 || remainingRange < dist
      let recommendedStation: any = null

      if (needCharging || remainingRange < dist * 1.5) {
        const midLat = (from.lat + to.lat) / 2
        const midLng = (from.lng + to.lng) / 2

        const nearbyStations = stations
          .map(s => ({ ...s, distanceToMid: haversine(midLat, midLng, s.lat, s.lng) }))
          .filter(s => s.distanceToMid < dist * 0.6)
          .sort((a, b) => {
            if (sortBy === 'price') return (a.min_price || 999) - (b.min_price || 999)
            if (sortBy === 'waiting') return b.available_fast_count - a.available_fast_count
            return a.distanceToMid - b.distanceToMid
          })

        if (nearbyStations.length > 0) {
          recommendedStation = nearbyStations[0]

          const chargeTargetSoc = 80
          const chargeKwh = ((chargeTargetSoc - Math.max(socAtArrival, 10)) / 100) * batteryCapacity
          const chargeCost = +(chargeKwh * (recommendedStation.min_price || 1.0)).toFixed(2)

          chargingStops.push({
            station: recommendedStation,
            location: { lat: recommendedStation.lat, lng: recommendedStation.lng },
            distanceFromStart: totalDistance - dist + haversine(from.lat, from.lng, recommendedStation.lat, recommendedStation.lng),
            suggestedChargeSoc: chargeTargetSoc,
            estimatedChargeKwh: +chargeKwh.toFixed(2),
            estimatedCost: chargeCost,
            estimatedWaitMin: Math.max(0, Math.floor((1 - recommendedStation.available_fast_count / recommendedStation.total_piles) * 15)),
          })

          totalCost += chargeCost
          currentSocValue = chargeTargetSoc
          remainingRange = (currentSocValue / 100) * safeRange
          needCharging = true
        }
      }

      segments.push({
        from,
        to,
        distanceKm: +dist.toFixed(1),
        needCharging,
        recommendedStation: recommendedStation ? {
          id: recommendedStation.id,
          name: recommendedStation.name,
          address: recommendedStation.address,
          operator: recommendedStation.operator_name,
          availablePiles: recommendedStation.available_fast_count,
          pricePerKwh: recommendedStation.min_price,
          distanceFromRoute: +recommendedStation.distanceToMid.toFixed(1),
        } : undefined,
        estimatedSocAtArrival: +Math.max(0, socAtArrival).toFixed(1),
      })

      currentSocValue = Math.max(0, socAtArrival)
      remainingRange = (currentSocValue / 100) * safeRange
    }

    const totalDurationMin = Math.ceil(totalDistance / 100 * 60 + chargingStops.reduce((sum, s) => sum + 30 + s.estimatedWaitMin, 0))

    res.json({
      success: true,
      data: {
        totalDistance: +totalDistance.toFixed(1),
        totalDurationMin,
        totalCost: +totalCost.toFixed(2),
        segments,
        chargingStops,
        vehicleInfo: { batteryCapacity, currentSoc, maxRange: +maxRange.toFixed(0), safeRange: +safeRange.toFixed(0) },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
