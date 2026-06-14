import { Router, type Request, type Response } from 'express'
import { mockServices } from '../data/mock.js'
import type { ServiceEntry, UserLocation } from '../../shared/types.js'

const router = Router()

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

interface ServiceLocation {
  serviceId: string
  lat: number
  lng: number
}

const serviceLocations: ServiceLocation[] = [
  { serviceId: 's1', lat: 36.0671, lng: 120.3826 },
  { serviceId: 's2', lat: 36.0681, lng: 120.3085 },
  { serviceId: 's3', lat: 36.0598, lng: 120.3179 },
  { serviceId: 's4', lat: 36.0897, lng: 120.3462 },
  { serviceId: 's5', lat: 36.0635, lng: 120.3271 },
  { serviceId: 's6', lat: 36.0752, lng: 120.3875 },
  { serviceId: 's7', lat: 36.0832, lng: 120.3156 },
  { serviceId: 's8', lat: 36.0487, lng: 120.3362 },
  { serviceId: 's9', lat: 36.0671, lng: 120.3826 },
  { serviceId: 's10', lat: 36.0681, lng: 120.3085 },
]

router.post('/rank', (req: Request, res: Response): void => {
  try {
    const location = req.body as Partial<UserLocation>

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      res.status(400).json({
        success: false,
        error: '参数错误：需要提供 lat 和 lng',
      })
      return
    }

    const ranked = mockServices
      .map((service) => {
        const sl = serviceLocations.find((l) => l.serviceId === service.id)
        const distance = sl
          ? haversine(location.lat!, location.lng!, sl.lat, sl.lng)
          : 9999
        const distanceScore = Math.max(0, 100 - distance * 2)
        const finalScore = service.score * 0.6 + distanceScore * 0.4
        return {
          ...service,
          distance: Number(distance.toFixed(2)),
          rankScore: Number(finalScore.toFixed(2)),
        }
      })
      .sort((a, b) => b.rankScore - a.rankScore) as (ServiceEntry & {
      distance: number
      rankScore: number
    })[]

    res.json({
      success: true,
      data: ranked,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务排序失败',
    })
  }
})

export default router
