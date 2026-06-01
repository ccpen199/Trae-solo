import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10))
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: any[] = []

  if (req.query.battery_id) {
    conditions.push('battery_id = ?')
    params.push(req.query.battery_id)
  }
  if (req.query.vehicle_id) {
    conditions.push('vehicle_id = ?')
    params.push(req.query.vehicle_id)
  }
  if (req.query.station_id) {
    conditions.push('station_id = ?')
    params.push(req.query.station_id)
  }
  if (req.query.has_anomaly !== undefined) {
    conditions.push('has_anomaly = ?')
    params.push(parseInt(req.query.has_anomaly as string))
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const total = (db.prepare(`SELECT COUNT(*) as count FROM usage_records ${whereClause}`).get(...params) as { count: number }).count
  const rows = db.prepare(`SELECT * FROM usage_records ${whereClause} ORDER BY recorded_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  res.json({ success: true, data: { list: rows, total, page, pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const row = db.prepare('SELECT * FROM usage_records WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: '使用记录不存在' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response): void => {
  const id = uuidv4()
  const { battery_id, vehicle_id, station_id, order_id, charge_cycles, temperature, soc, soh, has_anomaly, anomaly_desc, recorded_at } = req.body

  if (!battery_id) {
    res.status(400).json({ success: false, error: '缺少电池ID' })
    return
  }

  const battery = db.prepare('SELECT id FROM batteries WHERE id = ?').get(battery_id)
  if (!battery) {
    res.status(400).json({ success: false, error: '电池不存在' })
    return
  }

  const openHighAlerts = db.prepare(
    "SELECT id, alert_type, severity, description FROM safety_alerts WHERE battery_id = ? AND status IN ('open', 'reviewing') AND severity IN ('high', 'critical')"
  ).all(battery_id) as { id: string; alert_type: string; severity: string; description: string }[]
  if (openHighAlerts.length > 0) {
    res.status(403).json({
      success: false,
      error: '该电池存在未处理的高风险告警，禁止新增使用记录。请先处理安全告警。',
      riskAlerts: openHighAlerts,
    })
    return
  }

  db.prepare(`
    INSERT INTO usage_records (id, battery_id, vehicle_id, station_id, order_id, charge_cycles, temperature, soc, soh, has_anomaly, anomaly_desc, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, battery_id, vehicle_id || null, station_id || null, order_id || null, charge_cycles || 0, temperature || null, soc || null, soh || null, has_anomaly || 0, anomaly_desc || null, recorded_at || null)

  const row = db.prepare('SELECT * FROM usage_records WHERE id = ?').get(id)
  res.status(201).json({ success: true, data: row })
})

router.put('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM usage_records WHERE id = ?').get(req.params.id)
  if (!existing) {
    res.status(404).json({ success: false, error: '使用记录不存在' })
    return
  }

  const fields: string[] = []
  const params: any[] = []

  const allowedFields = ['battery_id', 'vehicle_id', 'station_id', 'order_id', 'charge_cycles', 'temperature', 'soc', 'soh', 'has_anomaly', 'anomaly_desc', 'recorded_at']
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

  params.push(req.params.id)
  db.prepare(`UPDATE usage_records SET ${fields.join(', ')} WHERE id = ?`).run(...params)

  const row = db.prepare('SELECT * FROM usage_records WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: row })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM usage_records WHERE id = ?').get(req.params.id)
  if (!existing) {
    res.status(404).json({ success: false, error: '使用记录不存在' })
    return
  }

  db.prepare('DELETE FROM usage_records WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: null })
})

export default router
