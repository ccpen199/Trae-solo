import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/summary', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const totalIncome = (db.prepare(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM revenue_records",
    ).get() as { total: number }).total

    const totalElectricityCost = (db.prepare(
      "SELECT COALESCE(SUM(electricity_cost), 0) as total FROM revenue_records",
    ).get() as { total: number }).total

    const totalRefunds = (db.prepare(
      "SELECT COALESCE(SUM(refund_deduction), 0) as total FROM revenue_records",
    ).get() as { total: number }).total

    const totalPartnerShare = (db.prepare(
      "SELECT COALESCE(SUM(partner_share), 0) as total FROM revenue_records",
    ).get() as { total: number }).total

    const totalPlatformShare = (db.prepare(
      "SELECT COALESCE(SUM(platform_share), 0) as total FROM revenue_records",
    ).get() as { total: number }).total

    const netIncome = Math.round((totalPlatformShare - totalElectricityCost) * 100) / 100

    res.json({
      success: true,
      data: {
        total_revenue: Math.round(totalIncome * 100) / 100,
        total_electricity_cost: Math.round(totalElectricityCost * 100) / 100,
        total_refund: Math.round(totalRefunds * 100) / 100,
        net_income: netIncome,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/by-site', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const bySite = db.prepare(`
      SELECT
        s.id as site_id,
        s.name as site_name,
        COUNT(rr.id) as order_count,
        COALESCE(SUM(rr.total_amount), 0) as total_revenue,
        COALESCE(SUM(rr.electricity_cost), 0) as electricity_cost,
        COALESCE(SUM(rr.refund_deduction), 0) as refund,
        COALESCE(SUM(rr.platform_share), 0) - COALESCE(SUM(rr.electricity_cost), 0) as net_income
      FROM sites s
      LEFT JOIN revenue_records rr ON s.id = rr.site_id
      GROUP BY s.id, s.name
      ORDER BY total_revenue DESC
    `).all()

    res.json({ success: true, data: bySite })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/by-device', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const byDevice = db.prepare(`
      SELECT
        d.id as device_id,
        d.name as device_name,
        d.model as device_model,
        s.name as site_name,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.cost), 0) as total_revenue,
        COALESCE(SUM(o.energy), 0) as total_energy,
        COALESCE(SUM(o.duration), 0) as total_duration
      FROM devices d
      LEFT JOIN orders o ON d.id = o.device_id
      LEFT JOIN sites s ON d.site_id = s.id
      GROUP BY d.id, d.name, d.model, s.name
      ORDER BY total_revenue DESC
    `).all()

    res.json({ success: true, data: byDevice })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/by-partner', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const byPartner = db.prepare(`
      SELECT
        p.id as partner_id,
        p.name as partner_name,
        p.share_ratio,
        s.name as site_name,
        COUNT(rr.id) as order_count,
        COALESCE(SUM(rr.total_amount), 0) as total_amount,
        COALESCE(SUM(rr.partner_share), 0) as partner_share,
        COALESCE(SUM(rr.platform_share), 0) as platform_share,
        COALESCE(SUM(rr.refund_deduction), 0) as refund_deduction
      FROM partners p
      LEFT JOIN revenue_records rr ON p.id = rr.partner_id
      LEFT JOIN sites s ON p.site_id = s.id
      GROUP BY p.id, p.name, p.share_ratio, s.name
      ORDER BY partner_share DESC
    `).all()

    res.json({ success: true, data: byPartner })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/revenue-sharing', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const records = db.prepare(`
      SELECT
        rr.*,
        o.device_id,
        o.start_time as order_start_time,
        o.end_time as order_end_time,
        o.energy,
        o.status as order_status,
        d.name as device_name,
        s.name as site_name,
        p.name as partner_name,
        p.share_ratio
      FROM revenue_records rr
      LEFT JOIN orders o ON rr.order_id = o.id
      LEFT JOIN devices d ON o.device_id = d.id
      LEFT JOIN sites s ON rr.site_id = s.id
      LEFT JOIN partners p ON rr.partner_id = p.id
      ORDER BY rr.created_at DESC
    `).all()

    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/by-order', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { date_from, date_to, site_id, partner_id } = req.query
    const params: unknown[] = []
    const conditions: string[] = []

    if (date_from) {
      conditions.push('DATE(rr.created_at) >= ?')
      params.push(date_from)
    }
    if (date_to) {
      conditions.push('DATE(rr.created_at) <= ?')
      params.push(date_to)
    }
    if (site_id) {
      conditions.push('rr.site_id = ?')
      params.push(site_id)
    }
    if (partner_id) {
      conditions.push('rr.partner_id = ?')
      params.push(partner_id)
    }

    let sql = `
      SELECT
        rr.id as record_id,
        o.id as order_id,
        s.name as site_name,
        d.name as device_name,
        p.name as partner_name,
        o.energy,
        o.duration,
        o.cost as total_amount,
        rr.electricity_cost,
        rr.partner_share,
        rr.platform_share,
        rr.refund_deduction,
        rr.created_at
      FROM revenue_records rr
      LEFT JOIN orders o ON rr.order_id = o.id
      LEFT JOIN sites s ON rr.site_id = s.id
      LEFT JOIN devices d ON o.device_id = d.id
      LEFT JOIN partners p ON rr.partner_id = p.id
    `

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY rr.created_at DESC LIMIT 100'

    const records = db.prepare(sql).all(...params)
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/refunds', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { date_from, date_to } = req.query
    const params: unknown[] = []
    const conditions: string[] = ['o.refund_status IN (?, ?)']
    params.push('partial', 'full')

    if (date_from) {
      conditions.push('DATE(o.updated_at) >= ?')
      params.push(date_from)
    }
    if (date_to) {
      conditions.push('DATE(o.updated_at) <= ?')
      params.push(date_to)
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ')

    const refunds = db.prepare(`
      SELECT
        o.id,
        s.name as site_name,
        d.name as device_name,
        o.cost as original_amount,
        o.refund_amount,
        o.refund_status,
        o.updated_at as refund_time
      FROM orders o
      LEFT JOIN sites s ON o.site_id = s.id
      LEFT JOIN devices d ON o.device_id = d.id
      ${whereClause}
      ORDER BY o.updated_at DESC
      LIMIT 50
    `).all(...params)

    res.json({ success: true, data: refunds })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
