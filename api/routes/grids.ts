import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const grids = db.prepare('SELECT * FROM capacity_grids ORDER BY grid_code ASC').all()
    res.json({ success: true, data: grids })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/heatmap/data', (req: Request, res: Response): void => {
  try {
    const data = db.prepare('SELECT id, grid_code, grid_name, center_lat, center_lng, heat_density, active_orders, rider_count FROM capacity_grids ORDER BY grid_code ASC').all()
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const grid = db.prepare('SELECT * FROM capacity_grids WHERE id = ?').get(req.params.id)
    if (!grid) {
      res.status(404).json({ success: false, error: 'Grid not found' })
      return
    }

    const riderCount = (db.prepare(
      `SELECT COUNT(*) as count FROM riders WHERE status = 'online'
       AND latitude BETWEEN ? - 0.01 AND ? + 0.01
       AND longitude BETWEEN ? - 0.01 AND ? + 0.01`
    ).get((grid as any).center_lat, (grid as any).center_lat, (grid as any).center_lng, (grid as any).center_lng) as any).count

    const activeOrders = (db.prepare(
      `SELECT COUNT(*) as count FROM delivery_orders WHERE status IN ('assigned', 'picked_up')
       AND pickup_lat BETWEEN ? - 0.01 AND ? + 0.01
       AND pickup_lng BETWEEN ? - 0.01 AND ? + 0.01`
    ).get((grid as any).center_lat, (grid as any).center_lat, (grid as any).center_lng, (grid as any).center_lng) as any).count

    res.json({ success: true, data: { ...grid, live_rider_count: riderCount, live_active_orders: activeOrders } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM capacity_grids WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Grid not found' })
      return
    }

    const { heat_density, load_balance_coefficient, weather_factor, weather_description } = req.body
    const now = new Date().toISOString()

    db.prepare(
      `UPDATE capacity_grids SET heat_density=?, load_balance_coefficient=?, weather_factor=?, weather_description=?, updated_at=? WHERE id=?`
    ).run(
      heat_density ?? (existing as any).heat_density,
      load_balance_coefficient ?? (existing as any).load_balance_coefficient,
      weather_factor ?? (existing as any).weather_factor,
      weather_description ?? (existing as any).weather_description,
      now,
      req.params.id
    )

    const grid = db.prepare('SELECT * FROM capacity_grids WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: grid })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
