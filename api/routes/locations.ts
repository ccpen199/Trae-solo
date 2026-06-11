import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database.js'

const router = Router()

function formatLocation(row: Record<string, unknown>) {
  return {
    id: row.id,
    deviceId: row.device_id,
    lat: row.lat,
    lng: row.lng,
    accuracy: row.accuracy,
    mode: row.mode,
    speed: row.speed,
    timestamp: row.timestamp,
  }
}

function formatGeofence(row: Record<string, unknown>) {
  return {
    id: row.id,
    deviceId: row.device_id,
    name: row.name,
    type: row.type,
    coordinates: typeof row.coordinates === 'string' ? JSON.parse(row.coordinates) : row.coordinates,
    radius: row.radius,
    rule: row.rule,
    schedule: typeof row.schedule === 'string' ? JSON.parse(row.schedule) : row.schedule,
    enabled: !!row.enabled,
    alertLevel: row.alert_level,
    createdAt: row.created_at,
  }
}

router.get('/locations', (req: Request, res: Response): void => {
  const db = getDb()
  const { deviceId, from, to } = req.query

  let sql = 'SELECT * FROM locations WHERE 1=1'
  const params: unknown[] = []

  if (deviceId) {
    const device = db.prepare('SELECT id FROM devices WHERE id = ?').get(String(deviceId))
    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' })
      return
    }
    sql += ' AND device_id = ?'
    params.push(String(deviceId))
  }
  if (from) {
    sql += ' AND timestamp >= ?'
    params.push(String(from))
  }
  if (to) {
    sql += ' AND timestamp <= ?'
    params.push(String(to))
  }

  sql += ' ORDER BY timestamp DESC LIMIT 300'
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(formatLocation) })
})

router.get('/devices/:id/locations', (req: Request, res: Response): void => {
  const db = getDb()
  const { id } = req.params
  const { from, to } = req.query

  const device = db.prepare('SELECT id FROM devices WHERE id = ?').get(id)
  if (!device) {
    res.status(404).json({ success: false, error: 'Device not found' })
    return
  }

  let sql = 'SELECT * FROM locations WHERE device_id = ?'
  const params: unknown[] = [id]

  if (from) {
    sql += ' AND timestamp >= ?'
    params.push(from)
  }
  if (to) {
    sql += ' AND timestamp <= ?'
    params.push(to)
  }

  sql += ' ORDER BY timestamp DESC'
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(formatLocation) })
})

router.get('/devices/:id/locations/realtime', (req: Request, res: Response): void => {
  const db = getDb()
  const { id } = req.params

  const device = db.prepare('SELECT id FROM devices WHERE id = ?').get(id)
  if (!device) {
    res.status(404).json({ success: false, error: 'Device not found' })
    return
  }

  const row = db.prepare('SELECT * FROM locations WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1').get(id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'No location data available' })
    return
  }

  res.json({ success: true, data: formatLocation(row) })
})

router.get('/geofences', (_req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM geofences ORDER BY created_at DESC').all() as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(formatGeofence) })
})

router.post('/geofences', (req: Request, res: Response): void => {
  const { deviceId, name, type, coordinates, radius, rule, schedule, enabled, alertLevel } = req.body

  if (!deviceId || !name || !type || !coordinates) {
    res.status(400).json({ success: false, error: 'deviceId, name, type, and coordinates are required' })
    return
  }

  const db = getDb()
  const device = db.prepare('SELECT id FROM devices WHERE id = ?').get(deviceId)
  if (!device) {
    res.status(404).json({ success: false, error: 'Device not found' })
    return
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO geofences (id, device_id, name, type, coordinates, radius, rule, schedule, enabled, alert_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, deviceId, name, type,
    typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates),
    radius || null,
    rule || 'both',
    typeof schedule === 'string' ? schedule : JSON.stringify(schedule || {}),
    enabled !== undefined ? (enabled ? 1 : 0) : 1,
    alertLevel || 'medium',
  )

  const row = db.prepare('SELECT * FROM geofences WHERE id = ?').get(id) as Record<string, unknown>
  res.status(201).json({ success: true, data: formatGeofence(row) })
})

router.put('/geofences/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM geofences WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Geofence not found' })
    return
  }

  const updates: string[] = []
  const params: unknown[] = []

  const fields: Record<string, unknown> = {
    name: req.body.name,
    type: req.body.type,
    coordinates: req.body.coordinates ? (typeof req.body.coordinates === 'string' ? req.body.coordinates : JSON.stringify(req.body.coordinates)) : undefined,
    radius: req.body.radius,
    rule: req.body.rule,
    schedule: req.body.schedule ? (typeof req.body.schedule === 'string' ? req.body.schedule : JSON.stringify(req.body.schedule)) : undefined,
    enabled: req.body.enabled !== undefined ? (req.body.enabled ? 1 : 0) : undefined,
    alert_level: req.body.alertLevel,
  }

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`)
      params.push(value)
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: 'No fields to update' })
    return
  }

  params.push(req.params.id)
  db.prepare(`UPDATE geofences SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  const updated = db.prepare('SELECT * FROM geofences WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json({ success: true, data: formatGeofence(updated) })
})

router.delete('/geofences/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM geofences WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Geofence not found' })
    return
  }

  db.prepare('DELETE FROM geofences WHERE id = ?').run(req.params.id)
  res.json({ success: true, message: 'Geofence deleted successfully' })
})

export default router
