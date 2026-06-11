import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database.js'

const router = Router()

function formatCall(row: Record<string, unknown>) {
  return {
    id: row.id,
    deviceId: row.device_id,
    type: row.type,
    direction: row.direction,
    callerNumber: row.caller_number,
    duration: row.duration,
    timestamp: row.timestamp,
    hasRecording: !!row.has_recording,
    recordingUrl: row.recording_url || undefined,
  }
}

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { deviceId, from, to } = req.query

  let sql = 'SELECT * FROM call_records WHERE 1=1'
  const params: unknown[] = []

  if (deviceId) {
    sql += ' AND device_id = ?'
    params.push(deviceId)
  }
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
  res.json({ success: true, data: rows.map(formatCall) })
})

router.get('/:id/recording', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM call_records WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Call record not found' })
    return
  }

  if (!row.has_recording || !row.recording_url) {
    res.status(404).json({ success: false, error: 'No recording available for this call' })
    return
  }

  res.json({
    success: true,
    data: {
      id: row.id,
      recordingUrl: row.recording_url,
      type: row.type,
      duration: row.duration,
    },
  })
})

router.post('/dial', (req: Request, res: Response): void => {
  const { deviceId, type, callerNumber } = req.body

  if (!deviceId || !callerNumber) {
    res.status(400).json({ success: false, error: 'deviceId and callerNumber are required' })
    return
  }

  const db = getDb()
  const device = db.prepare('SELECT id, status FROM devices WHERE id = ?').get(deviceId) as Record<string, unknown> | undefined

  if (!device) {
    res.status(404).json({ success: false, error: 'Device not found' })
    return
  }

  if (device.status === 'offline') {
    res.status(400).json({ success: false, error: 'Device is offline, cannot initiate call' })
    return
  }

  const id = uuidv4()
  const now = new Date().toISOString().replace('T', ' ').replace('Z', '')

  db.prepare(`
    INSERT INTO call_records (id, device_id, type, direction, caller_number, duration, timestamp, has_recording)
    VALUES (?, ?, ?, 'outbound', ?, 0, ?, 0)
  `).run(id, deviceId, type || 'audio', callerNumber, now)

  const row = db.prepare('SELECT * FROM call_records WHERE id = ?').get(id) as Record<string, unknown>
  res.status(201).json({ success: true, data: formatCall(row) })
})

export default router
