import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status } = req.query
    let sql = 'SELECT * FROM sites'
    const params: unknown[] = []

    if (status) {
      sql += ' WHERE status = ?'
      params.push(status)
    }
    sql += ' ORDER BY created_at DESC'

    const sites = db.prepare(sql).all(...params) as Record<string, unknown>[]
    res.json({ success: true, data: sites })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

    if (!site) {
      res.status(404).json({ success: false, error: 'Site not found' })
      return
    }

    const partners = db.prepare('SELECT * FROM partners WHERE site_id = ?').all(req.params.id)
    const revenue = db.prepare(`
      SELECT
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(electricity_cost), 0) as total_electricity_cost,
        COALESCE(SUM(refund_deduction), 0) as total_refund,
        COALESCE(SUM(platform_share), 0) - COALESCE(SUM(electricity_cost), 0) as net_income
      FROM revenue_records WHERE site_id = ?
    `).get(req.params.id)
    const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices WHERE site_id = ?').get(req.params.id) as { count: number }

    res.json({ success: true, data: { ...site, partners, revenue, device_count: deviceCount.count } })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/:id/partners', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id)

    if (!site) {
      res.status(404).json({ success: false, error: 'Site not found' })
      return
    }

    const partners = db.prepare('SELECT * FROM partners WHERE site_id = ?').all(req.params.id)
    res.json({ success: true, data: partners })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { name, address, operator, electricity_price, service_fee, business_hours_start, business_hours_end, status } = req.body

    if (!name || !address || !operator) {
      res.status(400).json({ success: false, error: 'name, address, and operator are required' })
      return
    }

    const result = db.prepare(`
      INSERT INTO sites (name, address, operator, device_count, electricity_price, service_fee, business_hours_start, business_hours_end, status)
      VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)
    `).run(
      name,
      address,
      operator,
      electricity_price ?? 0.0,
      service_fee ?? 0.0,
      business_hours_start ?? '00:00',
      business_hours_end ?? '23:59',
      status ?? 'active',
    )

    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: site })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

    if (!existing) {
      res.status(404).json({ success: false, error: 'Site not found' })
      return
    }

    const { name, address, operator, electricity_price, service_fee, business_hours_start, business_hours_end, status } = req.body

    db.prepare(`
      UPDATE sites SET
        name = ?, address = ?, operator = ?, electricity_price = ?, service_fee = ?,
        business_hours_start = ?, business_hours_end = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ?? existing.name,
      address ?? existing.address,
      operator ?? existing.operator,
      electricity_price ?? existing.electricity_price,
      service_fee ?? existing.service_fee,
      business_hours_start ?? existing.business_hours_start,
      business_hours_end ?? existing.business_hours_end,
      status ?? existing.status,
      req.params.id,
    )

    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: site })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id)

    if (!existing) {
      res.status(404).json({ success: false, error: 'Site not found' })
      return
    }

    db.prepare('DELETE FROM sites WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: { message: 'Site deleted' } })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
