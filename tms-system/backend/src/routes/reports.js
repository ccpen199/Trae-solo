import express from 'express'
import { db } from '../models/database.js'

const router = express.Router()

router.get('/timely', (req, res) => {
  try {
    const timely = db.prepare(`
      SELECT
        o.pickup_city || '-' || o.delivery_city as route,
        COUNT(*) as total_orders,
        AVG(
          CASE
            WHEN w.signed_at IS NOT NULL AND w.assigned_at IS NOT NULL
            THEN (julianday(w.signed_at) - julianday(w.assigned_at)) * 24
            ELSE NULL
          END
        ) as avg_duration,
        SUM(CASE WHEN w.signed_at IS NOT NULL THEN 1 ELSE 0 END) as on_time_count,
        ROUND(CAST(SUM(CASE WHEN w.signed_at IS NOT NULL THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as on_time_rate
      FROM waybills w
      LEFT JOIN orders o ON w.order_id = o.id
      GROUP BY o.pickup_city, o.delivery_city
    `).all()

    res.json({ data: timely })
  } catch (error) {
    res.status(500).json({ message: '获取时效统计失败' })
  }
})

router.get('/exception', (req, res) => {
  try {
    const exception = db.prepare(`
      SELECT
        type,
        COUNT(*) as count,
        ROUND(CAST(COUNT(*) AS FLOAT) / (SELECT COUNT(*) FROM exceptions) * 100, 2) as percentage
      FROM exceptions
      GROUP BY type
    `).all()

    res.json({ data: exception })
  } catch (error) {
    res.status(500).json({ message: '获取异常统计失败' })
  }
})

router.get('/cost', (req, res) => {
  try {
    const cost = db.prepare(`
      SELECT
        o.pickup_city || '-' || o.delivery_city as route,
        SUM(f.total_freight) as total_cost,
        ROUND(SUM(f.total_freight) / NULLIF(SUM(f.distance), 0), 2) as cost_per_km,
        ROUND(SUM(f.total_freight) / NULLIF(SUM(f.weight), 0), 2) as cost_per_ton
      FROM freights f
      LEFT JOIN waybills w ON f.waybill_id = w.id
      LEFT JOIN orders o ON w.order_id = o.id
      GROUP BY o.pickup_city, o.delivery_city
    `).all()

    res.json({ data: cost })
  } catch (error) {
    res.status(500).json({ message: '获取成本统计失败' })
  }
})

router.get('/signing', (req, res) => {
  try {
    const signing = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as period,
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('SIGNED', 'COMPLETED') THEN 1 ELSE 0 END) as signed_count,
        SUM(CASE WHEN status NOT IN ('SIGNED', 'COMPLETED') THEN 1 ELSE 0 END) as pending_count,
        ROUND(CAST(SUM(CASE WHEN status IN ('SIGNED', 'COMPLETED') THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as rate
      FROM waybills
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY period DESC
      LIMIT 12
    `).all()

    res.json({ data: signing })
  } catch (error) {
    res.status(500).json({ message: '获取签收率统计失败' })
  }
})

router.get('/comprehensive', (req, res) => {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM waybills').get().count
    const totalDistance = db.prepare('SELECT COALESCE(SUM(actual_distance), 0) as total FROM waybills').get().total

    const completedWaybills = db.prepare("SELECT COUNT(*) as count FROM waybills WHERE status IN ('SIGNED', 'COMPLETED')").get().count
    const onTimeRate = totalOrders > 0 ? Math.round((completedWaybills / totalOrders) * 10000) / 100 : 0

    const totalExceptions = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status NOT IN ('RESOLVED', 'CLOSED')").get().count
    const exceptionRate = totalOrders > 0 ? Math.round((totalExceptions / totalOrders) * 10000) / 100 : 0

    const timely = db.prepare(`
      SELECT
        o.pickup_city || '-' || o.delivery_city as route,
        COUNT(*) as total_orders,
        AVG(
          CASE
            WHEN w.signed_at IS NOT NULL AND w.assigned_at IS NOT NULL
            THEN (julianday(w.signed_at) - julianday(w.assigned_at)) * 24
            ELSE NULL
          END
        ) as avg_duration,
        SUM(CASE WHEN w.signed_at IS NOT NULL THEN 1 ELSE 0 END) as on_time_count,
        ROUND(CAST(SUM(CASE WHEN w.signed_at IS NOT NULL THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as on_time_rate
      FROM waybills w
      LEFT JOIN orders o ON w.order_id = o.id
      GROUP BY o.pickup_city, o.delivery_city
    `).all()

    const exception = db.prepare(`
      SELECT type, COUNT(*) as count, ROUND(CAST(COUNT(*) AS FLOAT) / (SELECT COUNT(*) FROM exceptions WHERE 1=1) * 100, 2) as percentage
      FROM exceptions
      GROUP BY type
    `).all()

    const cost = db.prepare(`
      SELECT
        o.pickup_city || '-' || o.delivery_city as route,
        SUM(f.total_freight) as total_cost,
        ROUND(SUM(f.total_freight) / NULLIF(SUM(f.distance), 0), 2) as cost_per_km,
        ROUND(SUM(f.total_freight) / NULLIF(SUM(f.weight), 0), 2) as cost_per_ton
      FROM freights f
      LEFT JOIN waybills w ON f.waybill_id = w.id
      LEFT JOIN orders o ON w.order_id = o.id
      GROUP BY o.pickup_city, o.delivery_city
    `).all()

    const signing = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as period,
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('SIGNED', 'COMPLETED') THEN 1 ELSE 0 END) as signed,
        SUM(CASE WHEN status NOT IN ('SIGNED', 'COMPLETED') THEN 1 ELSE 0 END) as pending,
        ROUND(CAST(SUM(CASE WHEN status IN ('SIGNED', 'COMPLETED') THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as rate
      FROM waybills
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY period DESC
      LIMIT 6
    `).all()

    res.json({
      data: {
        stats: { totalOrders, totalDistance, onTimeRate, exceptionRate },
        timely,
        exception,
        cost,
        signing
      }
    })
  } catch (error) {
    console.error('Comprehensive report error:', error)
    res.status(500).json({ message: '获取综合报表失败' })
  }
})

export default router
