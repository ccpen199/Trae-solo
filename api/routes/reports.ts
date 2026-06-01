import { Router, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/inventory-value', (_req, _res: Response): void => {
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count, SUM(capacity) as total_capacity
    FROM batteries
    GROUP BY status
  `).all()

  const bySupplier = db.prepare(`
    SELECT supplier, COUNT(*) as count, SUM(capacity) as total_capacity
    FROM batteries
    GROUP BY supplier
  `).all()

  const total = db.prepare(`
    SELECT COUNT(*) as total_count, SUM(capacity) as total_capacity
    FROM batteries
  `).get() as { total_count: number; total_capacity: number | null }

  _res.json({
    success: true,
    data: {
      total: { count: total.total_count, capacity: total.total_capacity || 0 },
      byStatus,
      bySupplier,
    },
  })
})

router.get('/health-distribution', (_req, _res: Response): void => {
  const rows = db.prepare(`
    SELECT soh FROM usage_records
    WHERE soh IS NOT NULL
    ORDER BY recorded_at DESC
  `).all() as { soh: number }[]

  const batteryLatestSoh = new Map<string, number>()
  const allRecords = db.prepare(`
    SELECT battery_id, soh, recorded_at FROM usage_records
    WHERE soh IS NOT NULL
    ORDER BY recorded_at ASC
  `).all() as { battery_id: string; soh: number; recorded_at: string }[]

  for (const record of allRecords) {
    batteryLatestSoh.set(record.battery_id, record.soh)
  }

  const distribution = [
    { range: '0-20', min: 0, max: 20, count: 0 },
    { range: '20-40', min: 20, max: 40, count: 0 },
    { range: '40-60', min: 40, max: 60, count: 0 },
    { range: '60-80', min: 60, max: 80, count: 0 },
    { range: '80-100', min: 80, max: 100, count: 0 },
  ]

  for (const soh of batteryLatestSoh.values()) {
    for (const bucket of distribution) {
      if (soh >= bucket.min && soh < bucket.max) {
        bucket.count++
        break
      }
      if (bucket.range === '80-100' && soh >= bucket.min && soh <= bucket.max) {
        bucket.count++
        break
      }
    }
  }

  const batteriesWithoutRecords = db.prepare(`
    SELECT COUNT(*) as count FROM batteries
    WHERE id NOT IN (SELECT DISTINCT battery_id FROM usage_records WHERE soh IS NOT NULL)
  `).get() as { count: number }

  _res.json({
    success: true,
    data: {
      distribution,
      batteriesWithoutRecords: batteriesWithoutRecords.count,
    },
  })
})

router.get('/retirement-forecast', (_req, _res: Response): void => {
  const sixMonthsLater = new Date()
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)
  const sixMonthsStr = sixMonthsLater.toISOString().slice(0, 10)

  const twelveMonthsLater = new Date()
  twelveMonthsLater.setMonth(twelveMonthsLater.getMonth() + 12)
  const twelveMonthsStr = twelveMonthsLater.toISOString().slice(0, 10)

  const warrantyExpired6 = db.prepare(`
    SELECT b.*, 'warranty_expired' as reason
    FROM batteries b
    WHERE b.warranty_date <= ? AND b.status NOT IN ('retired')
  `).all(sixMonthsStr)

  const warrantyExpired12 = db.prepare(`
    SELECT b.*, 'warranty_expired' as reason
    FROM batteries b
    WHERE b.warranty_date <= ? AND b.warranty_date > ? AND b.status NOT IN ('retired')
  `).all(twelveMonthsStr, sixMonthsStr)

  const sohLow = db.prepare(`
    SELECT b.*, ur.soh, 'soh_low' as reason
    FROM batteries b
    JOIN (
      SELECT battery_id, MAX(recorded_at) as latest_at
      FROM usage_records
      WHERE soh IS NOT NULL
      GROUP BY battery_id
    ) latest ON b.id = latest.battery_id
    JOIN usage_records ur ON ur.battery_id = latest.battery_id AND ur.recorded_at = latest.latest_at AND ur.soh IS NOT NULL
    WHERE ur.soh < 60 AND b.status NOT IN ('retired')
  `).all()

  _res.json({
    success: true,
    data: {
      sixMonths: {
        warrantyExpiring: warrantyExpired6,
        sohCritical: sohLow,
      },
      twelveMonths: {
        warrantyExpiring: warrantyExpired12,
      },
    },
  })
})

router.get('/supplier-quality', (_req, _res: Response): void => {
  const rows = db.prepare(`
    SELECT
      b.supplier,
      COUNT(DISTINCT b.id) as battery_count,
      AVG(ur.soh) as avg_soh,
      SUM(CASE WHEN ur.has_anomaly = 1 THEN 1 ELSE 0 END) as fault_count,
      COUNT(ur.id) as total_records
    FROM batteries b
    LEFT JOIN usage_records ur ON b.id = ur.battery_id
    GROUP BY b.supplier
  `).all()

  const data = rows.map((row: any) => ({
    supplier: row.supplier,
    battery_count: row.battery_count,
    avg_soh: row.avg_soh ? Math.round(row.avg_soh * 100) / 100 : null,
    fault_rate: row.total_records > 0 ? Math.round((row.fault_count / row.total_records) * 10000) / 100 : 0,
    fault_count: row.fault_count,
    total_records: row.total_records,
  }))

  _res.json({ success: true, data })
})

router.get('/depreciation', (_req, _res: Response): void => {
  const rows = db.prepare(`
    SELECT
      b.id,
      b.code,
      b.model,
      b.supplier,
      b.capacity,
      b.warranty_date,
      b.created_at,
      b.status,
      latest_ur.soh,
      latest_ur.soc
    FROM batteries b
    LEFT JOIN (
      SELECT ur1.battery_id, ur1.soh, ur1.soc
      FROM usage_records ur1
      INNER JOIN (
        SELECT battery_id, MAX(recorded_at) as max_date
        FROM usage_records
        WHERE soh IS NOT NULL
        GROUP BY battery_id
      ) ur2 ON ur1.battery_id = ur2.battery_id AND ur1.recorded_at = ur2.max_date
      WHERE ur1.soh IS NOT NULL
    ) latest_ur ON b.id = latest_ur.battery_id
  `).all()

  const data = rows.map((row: any) => {
    const purchaseValue = row.capacity * 800
    const sohFactor = row.soh ? row.soh / 100 : 1
    const ageDays = Math.floor((Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const ageFactor = Math.max(0, 1 - ageDays / (365 * 5))
    const currentValue = Math.round(purchaseValue * sohFactor * ageFactor)

    return {
      id: row.id,
      code: row.code,
      model: row.model,
      supplier: row.supplier,
      capacity: row.capacity,
      purchaseValue,
      currentValue,
      depreciation: purchaseValue - currentValue,
      depreciationRate: purchaseValue > 0 ? Math.round(((purchaseValue - currentValue) / purchaseValue) * 10000) / 100 : 0,
      soh: row.soh,
      ageDays,
      status: row.status,
    }
  })

  _res.json({ success: true, data })
})

export default router
