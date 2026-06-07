import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/income', (req: Request, res: Response): void => {
  const riderId = req.query.rider_id as string
  const startDate = req.query.start_date as string
  const endDate = req.query.end_date as string

  const conditions: string[] = []
  const params: any[] = []

  if (riderId) {
    conditions.push('i.rider_id = ?')
    params.push(riderId)
  }
  if (startDate) {
    conditions.push("i.created_at >= ?")
    params.push(startDate)
  }
  if (endDate) {
    conditions.push("i.created_at <= ?")
    params.push(endDate)
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const summary = db
    .prepare(
      `SELECT i.rider_id, r.name as rider_name, 
       COUNT(*) as order_count, 
       SUM(i.delivery_fee) as total_delivery_fee,
       SUM(i.tier_surcharge) as total_tier_surcharge,
       SUM(i.time_subsidy) as total_time_subsidy,
       SUM(i.referral_bonus) as total_referral_bonus,
       SUM(i.total_amount) as total_amount
       FROM incomes i LEFT JOIN riders r ON i.rider_id = r.id ${whereClause} 
       GROUP BY i.rider_id ORDER BY total_amount DESC`,
    )
    .all(...params)

  const overallTotal = (db.prepare(`SELECT SUM(total_amount) as total FROM incomes i ${whereClause}`).get(...params) as any).total || 0

  res.json({ success: true, data: { summary, overall_total: overallTotal } })
})

router.get('/rules', (_req: Request, res: Response): void => {
  const rules = db.prepare('SELECT * FROM pricing_rules ORDER BY id').all()
  res.json({ success: true, data: rules })
})

router.post('/rules', (req: Request, res: Response): void => {
  const { name, type, base_distance, base_fee, extra_per_km, time_start, time_end, subsidy_rate, tier_thresholds, is_active } = req.body

  if (!name || !type) {
    res.status(400).json({ success: false, error: '规则名称和类型为必填项' })
    return
  }

  const result = db
    .prepare(
      `INSERT INTO pricing_rules (name, type, base_distance, base_fee, extra_per_km, time_start, time_end, subsidy_rate, tier_thresholds, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(name, type, base_distance || 3, base_fee || 5, extra_per_km || 1.5, time_start || '', time_end || '', subsidy_rate || 0, tier_thresholds || '', is_active !== undefined ? is_active : 1)

  const rule = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: rule })
})

router.put('/rules/:id', (req: Request, res: Response): void => {
  const rule = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(req.params.id)
  if (!rule) {
    res.status(404).json({ success: false, error: '计价规则不存在' })
    return
  }

  const fields: string[] = []
  const params: any[] = []
  const allowedFields = ['name', 'type', 'base_distance', 'base_fee', 'extra_per_km', 'time_start', 'time_end', 'subsidy_rate', 'tier_thresholds', 'is_active']

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = ?`)
      params.push(req.body[field])
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ success: false, error: '没有需要更新的字段' })
    return
  }

  fields.push("updated_at = datetime('now', 'localtime')")
  params.push(req.params.id)

  db.prepare(`UPDATE pricing_rules SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  const updated = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.put('/settle/:id', (req: Request, res: Response): void => {
  const income = db.prepare('SELECT * FROM incomes WHERE id = ?').get(req.params.id)
  if (!income) {
    res.status(404).json({ success: false, error: '收入记录不存在' })
    return
  }
  if ((income as any).settle_status === 'settled') {
    res.status(400).json({ success: false, error: '该记录已结算' })
    return
  }
  db.prepare("UPDATE incomes SET settle_status = 'settled' WHERE id = ?").run(req.params.id)
  const updated = db.prepare('SELECT * FROM incomes WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router
