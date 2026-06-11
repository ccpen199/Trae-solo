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

router.get('/', (req: Request, res: Response): void => {
  try {
    const { lat, lng, radius = '50', type, operator } = req.query
    let stations = db.prepare(`
      SELECT cs.*, o.name as operator_name
      FROM charging_stations cs
      JOIN operators o ON cs.operator_id = o.id
    `).all() as any[]

    if (lat && lng) {
      const userLat = parseFloat(lat as string)
      const userLng = parseFloat(lng as string)
      const maxRadius = parseFloat(radius as string)
      stations = stations.filter(s => {
        const dist = haversine(userLat, userLng, s.lat, s.lng)
        return dist <= maxRadius
      }).map(s => ({
        ...s,
        distance: +haversine(userLat, userLng, s.lat, s.lng).toFixed(2),
      })).sort((a, b) => a.distance - b.distance)
    }

    if (type) {
      stations = stations.filter(s => s.type === type)
    }
    if (operator) {
      stations = stations.filter(s => s.operator_name === operator)
    }

    res.json({ success: true, data: stations })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const station = db.prepare(`
      SELECT cs.*, o.name as operator_name
      FROM charging_stations cs
      JOIN operators o ON cs.operator_id = o.id
      WHERE cs.id = ?
    `).get(req.params.id) as any | undefined

    if (!station) {
      res.status(404).json({ success: false, error: '充电站未找到' })
      return
    }
    res.json({ success: true, data: station })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/:id/piles', (req: Request, res: Response): void => {
  try {
    const piles = db.prepare(`
      SELECT * FROM charging_piles WHERE station_id = ?
    `).all(req.params.id)
    res.json({ success: true, data: piles })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
