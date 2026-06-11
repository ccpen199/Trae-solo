import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database.js'

const router = Router()

function formatDevice(row: Record<string, unknown>) {
  const settings = typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    imei: row.imei,
    status: row.status,
    batteryLevel: row.battery_level,
    signalStrength: row.signal_strength,
    firmwareVersion: row.firmware_version,
    settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM devices ORDER BY created_at DESC').all() as Record<string, unknown>[]
  const lastLocStmt = db.prepare('SELECT lat, lng, accuracy, timestamp FROM locations WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1')

  const devices = rows.map(row => {
    const lastLoc = lastLocStmt.get(row.id) as Record<string, unknown> | undefined
    const formatted = formatDevice(row)
    return {
      ...formatted,
      lastLocation: lastLoc
        ? { lat: lastLoc.lat, lng: lastLoc.lng, accuracy: lastLoc.accuracy, timestamp: lastLoc.timestamp }
        : null,
    }
  })

  res.json({ success: true, data: devices })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Device not found' })
    return
  }

  const lastLoc = db.prepare('SELECT lat, lng, accuracy, timestamp FROM locations WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1').get(row.id) as Record<string, unknown> | undefined
  const formatted = formatDevice(row)

  res.json({
    success: true,
    data: {
      ...formatted,
      lastLocation: lastLoc
        ? { lat: lastLoc.lat, lng: lastLoc.lng, accuracy: lastLoc.accuracy, timestamp: lastLoc.timestamp }
        : null,
    },
  })
})

router.post('/bind', (req: Request, res: Response): void => {
  const { name, type, imei } = req.body
  if (!name || !type || !imei) {
    res.status(400).json({ success: false, error: 'name, type, and imei are required' })
    return
  }
  if (!['watch', 'shoe'].includes(type)) {
    res.status(400).json({ success: false, error: 'type must be watch or shoe' })
    return
  }

  const db = getDb()
  const id = uuidv4()
  const settings = JSON.stringify({
    blockUnknownCalls: true,
    restrictedApps: [],
    classModeEnabled: false,
    classModeSchedule: [],
    batteryWarningThreshold: 20,
    batteryCriticalThreshold: 10,
  })

  try {
    db.prepare('INSERT INTO devices (id, name, type, imei, settings) VALUES (?, ?, ?, ?, ?)').run(id, name, type, imei, settings)
    const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as Record<string, unknown>
    res.status(201).json({ success: true, data: formatDevice(row) })
  } catch (err: unknown) {
    const message = err instanceof Error && err.message.includes('UNIQUE') ? 'IMEI already bound' : 'Failed to bind device'
    res.status(400).json({ success: false, error: message })
  }
})

router.delete('/:id/unbind', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Device not found' })
    return
  }

  db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id)
  res.json({ success: true, message: 'Device unbound successfully' })
})

router.put('/:id/settings', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Device not found' })
    return
  }

  const currentSettings = typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
  const newSettings = { ...currentSettings, ...req.body }
  const settingsJson = JSON.stringify(newSettings)

  db.prepare('UPDATE devices SET settings = ?, updated_at = datetime(\'now\') WHERE id = ?').run(settingsJson, req.params.id)
  const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json({ success: true, data: formatDevice(updated) })
})

router.post('/:id/ota', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Device not found' })
    return
  }

  if (row.status === 'offline') {
    res.status(400).json({ success: false, error: 'Device is offline, cannot perform OTA' })
    return
  }

  const { version } = req.body
  const newVersion = version || '2.2.0'
  db.prepare('UPDATE devices SET firmware_version = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newVersion, req.params.id)

  const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json({ success: true, data: formatDevice(updated), message: `OTA upgrade to v${newVersion} initiated` })
})

export default router
