import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

function clamp(value: number): number {
  return Math.max(0.08, Math.min(0.92, value))
}

function toMapPoint(latitude: number, longitude: number) {
  return {
    x: clamp((longitude - 73) / 62),
    y: clamp((54 - latitude) / 36),
  }
}

router.get('/realtime', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, vehicleType } = req.query
    let sql = `
      SELECT dl.id, dl.driver_id, dl.latitude, dl.longitude, dl.idle_status, dl.updated_at,
             dp.vehicle_type, dp.capacity, dp.plate_no, dp.credit_score,
             u.name, u.phone
      FROM driver_locations dl
      JOIN driver_profiles dp ON dl.driver_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    if (status) {
      sql += ' AND dl.idle_status = ?'
      params.push(status)
    }
    if (vehicleType) {
      sql += ' AND dp.vehicle_type = ?'
      params.push(vehicleType)
    }
    const drivers = db.prepare(sql).all(...params)
    res.json({
      success: true,
      drivers,
      total: drivers.length,
      timestamp: Date.now(),
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/drivers', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = db.prepare(`
      SELECT dl.id, dl.latitude, dl.longitude, dl.idle_status,
             dp.vehicle_type, dp.capacity, dp.credit_score,
             u.name, u.phone
      FROM driver_locations dl
      JOIN driver_profiles dp ON dl.driver_id = dp.id
      JOIN users u ON dp.user_id = u.id
      ORDER BY dp.credit_score DESC
      LIMIT 80
    `).all() as any[]

    const drivers = rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      phone: row.phone,
      vehicleType: row.vehicle_type,
      capacity: row.capacity,
      rating: Number((row.credit_score / 20).toFixed(1)),
      status: row.idle_status,
      location: toMapPoint(row.latitude, row.longitude),
    }))
    res.json(drivers)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/statistics', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM driver_profiles').get() as { count: number }
    const idle = db.prepare("SELECT COUNT(*) as count FROM driver_locations WHERE idle_status = 'idle'").get() as { count: number }
    const busy = db.prepare("SELECT COUNT(*) as count FROM driver_locations WHERE idle_status = 'busy'").get() as { count: number }
    const offline = db.prepare("SELECT COUNT(*) as count FROM driver_locations WHERE idle_status = 'offline'").get() as { count: number }
    const byType = db.prepare('SELECT vehicle_type, COUNT(*) as count FROM driver_profiles GROUP BY vehicle_type').all() as { vehicle_type: string; count: number }[]
    const byVehicleType: Record<string, number> = {}
    for (const row of byType) {
      byVehicleType[row.vehicle_type] = row.count
    }
    res.json({
      success: true,
      totalDrivers: total.count,
      idleDrivers: idle.count,
      busyDrivers: busy.count,
      offlineDrivers: offline.count,
      byVehicleType,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/driver/:driverId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params
    const driver = db.prepare(`
      SELECT dp.*, u.name, u.phone, u.company,
             dl.latitude, dl.longitude, dl.idle_status, dl.updated_at
      FROM driver_profiles dp
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN driver_locations dl ON dl.driver_id = dp.id
      WHERE dp.id = ?
    `).get(driverId) as any
    if (!driver) {
      res.status(404).json({ success: false, error: '司机不存在' })
      return
    }
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE assigned_driver_id = ?').get(driverId) as { count: number }
    const completedCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE assigned_driver_id = ? AND status = 'completed'").get(driverId) as { count: number }
    res.json({
      success: true,
      driver: {
        ...driver,
        totalOrders: orderCount.count,
        completedOrders: completedCount.count,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
