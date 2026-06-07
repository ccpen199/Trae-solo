import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const statusMap: Record<string, 'pickup' | 'in_transit' | 'delivered'> = {
  generated: 'pickup',
  loaded: 'pickup',
  in_transit: 'in_transit',
  arrived: 'delivered',
  signed: 'delivered',
}

const progressMap: Record<string, number> = {
  generated: 12,
  loaded: 24,
  in_transit: 68,
  arrived: 92,
  signed: 100,
}

router.get('/tracking', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = db.prepare(`
      SELECT w.*, o.from_city, o.to_city, o.cargo_type,
             u.name as driver_name,
             tl.temperature, tl.humidity
      FROM waybills w
      JOIN orders o ON w.order_id = o.id
      LEFT JOIN driver_profiles dp ON w.driver_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      LEFT JOIN (
        SELECT waybill_id, temperature, humidity
        FROM temperature_logs
        GROUP BY waybill_id
        HAVING MAX(recorded_at)
      ) tl ON tl.waybill_id = w.id
      ORDER BY w.created_at DESC
      LIMIT 12
    `).all() as any[]

    res.json(rows.map((row) => ({
      id: String(row.id),
      fromCity: row.from_city,
      toCity: row.to_city,
      driver: row.driver_name ?? '待分配',
      cargoType: row.cargo_type,
      status: statusMap[row.status] ?? 'pickup',
      temp: row.temperature ?? undefined,
      humidity: row.humidity ?? undefined,
      progress: progressMap[row.status] ?? 20,
    })))
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/alerts', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const tempAlerts = db.prepare(`
      SELECT tl.id, tl.waybill_id, tl.temperature, tl.recorded_at, o.from_city, o.to_city
      FROM temperature_logs tl
      JOIN waybills w ON tl.waybill_id = w.id
      JOIN orders o ON w.order_id = o.id
      WHERE tl.is_alert = 1
      ORDER BY tl.recorded_at DESC
      LIMIT 6
    `).all() as any[]

    const routeAlerts = db.prepare(`
      SELECT sw.id, sw.warning_level, sw.description, sw.created_at, rp.from_city, rp.to_city
      FROM supply_demand_warnings sw
      LEFT JOIN route_prices rp ON sw.route_id = rp.id
      ORDER BY sw.created_at DESC
      LIMIT 6
    `).all() as any[]

    const alerts = [
      ...tempAlerts.map((row) => ({
        id: `t-${row.id}`,
        type: 'temperature',
        message: `运单 #${row.waybill_id} 温度异常：当前 ${row.temperature}°C`,
        severity: 'warning',
        time: row.recorded_at,
        orderId: String(row.waybill_id),
      })),
      ...routeAlerts.map((row) => ({
        id: `r-${row.id}`,
        type: 'route',
        message: row.description ?? `${row.from_city ?? '重点'}→${row.to_city ?? '线路'} 供需异常`,
        severity: row.warning_level === 'critical' || row.warning_level === 'high' ? 'danger' : 'info',
        time: row.created_at,
        orderId: String(row.id),
      })),
    ].slice(0, 8)
    res.json(alerts)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/sensor/:waybillId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const records = db.prepare(`
      SELECT temperature, humidity, recorded_at
      FROM temperature_logs
      WHERE waybill_id = ?
      ORDER BY recorded_at ASC
      LIMIT 12
    `).all(req.params.waybillId) as any[]

    const rows = records.length > 0
      ? records
      : [
          { temperature: 4.0, humidity: 82, recorded_at: '10:00' },
          { temperature: 3.8, humidity: 84, recorded_at: '10:30' },
          { temperature: 4.2, humidity: 85, recorded_at: '11:00' },
          { temperature: 5.1, humidity: 83, recorded_at: '11:30' },
          { temperature: 7.8, humidity: 88, recorded_at: '12:00' },
          { temperature: 6.5, humidity: 86, recorded_at: '12:30' },
        ]

    const labels = rows.map((row) => String(row.recorded_at).slice(11, 16) || String(row.recorded_at))
    res.json({
      temp: { labels, values: rows.map((row) => row.temperature) },
      humid: { labels, values: rows.map((row) => row.humidity) },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
