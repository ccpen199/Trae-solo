import { Router, type Request, type Response } from 'express'
import { mockPOIs } from '../data/mock.js'
import type { PointOfInterest } from '../../shared/types.js'

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

router.get('/', (req: Request, res: Response): void => {
  try {
    const { type, keyword, lat, lng } = req.query
    const typeStr = type ? String(type) : ''
    const keywordStr = keyword ? String(keyword).trim() : ''
    const userLat = lat ? parseFloat(String(lat)) : NaN
    const userLng = lng ? parseFloat(String(lng)) : NaN

    let pois = [...mockPOIs] as (PointOfInterest & { distance?: number })[]

    if (typeStr) {
      pois = pois.filter((p) => p.type === typeStr)
    }

    if (keywordStr) {
      pois = pois.filter(
        (p) =>
          p.name.includes(keywordStr) ||
          p.address.includes(keywordStr) ||
          p.tags.some((t) => t.includes(keywordStr)),
      )
    }

    if (!isNaN(userLat) && !isNaN(userLng)) {
      pois = pois.map((p) => ({
        ...p,
        distance: haversine(userLat, userLng, p.lat, p.lng),
      }))
      pois.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    }

    res.json({
      success: true,
      data: pois,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取POI列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const poi = mockPOIs.find((p) => p.id === id)

    if (!poi) {
      res.status(404).json({
        success: false,
        error: '未找到该POI',
      })
      return
    }

    res.json({
      success: true,
      data: poi as PointOfInterest,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取POI详情失败',
    })
  }
})

export default router
