import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database.js'

const router = Router()

function formatAnomaly(row: Record<string, unknown>) {
  return {
    id: row.id,
    deviceId: row.device_id,
    type: row.type,
    confidence: row.confidence,
    description: row.description,
    timestamp: row.timestamp,
    resolved: !!row.resolved,
  }
}

interface BehaviorRule {
  id: string
  type: string
  threshold: number
  sensitivity: string
  enabled: boolean
  timeRange?: { start: string; end: string }
}

const defaultRules: BehaviorRule[] = [
  { id: 'rule_stillness', type: 'prolonged_stillness', threshold: 120, sensitivity: 'medium', enabled: true, timeRange: { start: '08:00', end: '22:00' } },
  { id: 'rule_night', type: 'nighttime_movement', threshold: 30, sensitivity: 'high', enabled: true, timeRange: { start: '22:00', end: '06:00' } },
  { id: 'rule_signal', type: 'signal_anomaly', threshold: 3, sensitivity: 'medium', enabled: true },
  { id: 'rule_route', type: 'unusual_route', threshold: 500, sensitivity: 'low', enabled: true, timeRange: { start: '07:00', end: '19:00' } },
]

let rulesState: BehaviorRule[] = [...defaultRules]

router.get('/anomalies', (req: Request, res: Response): void => {
  const db = getDb()
  const { deviceId, from, to } = req.query

  let sql = 'SELECT * FROM behavior_anomalies WHERE 1=1'
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
  res.json({ success: true, data: rows.map(formatAnomaly) })
})

router.get('/trends', (req: Request, res: Response): void => {
  const db = getDb()
  const { deviceId, period } = req.query
  const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 7

  const anomalies = db.prepare(`
    SELECT type, COUNT(*) as count, DATE(timestamp) as date
    FROM behavior_anomalies
    WHERE device_id ${deviceId ? '= ?' : 'IS NOT NULL'}
    AND timestamp >= datetime('now', '-${periodDays} days')
    GROUP BY type, DATE(timestamp)
    ORDER BY date ASC
  `).all(...(deviceId ? [deviceId] : [])) as Array<{ type: string; count: number; date: string }>

  const alerts = db.prepare(`
    SELECT type, COUNT(*) as count, DATE(timestamp) as date
    FROM alerts
    WHERE device_id ${deviceId ? '= ?' : 'IS NOT NULL'}
    AND timestamp >= datetime('now', '-${periodDays} days')
    GROUP BY type, DATE(timestamp)
    ORDER BY date ASC
  `).all(...(deviceId ? [deviceId] : [])) as Array<{ type: string; count: number; date: string }>

  const summary = db.prepare(`
    SELECT
      type,
      COUNT(*) as total,
      AVG(confidence) as avgConfidence,
      SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) as resolvedCount
    FROM behavior_anomalies
    WHERE device_id ${deviceId ? '= ?' : 'IS NOT NULL'}
    AND timestamp >= datetime('now', '-${periodDays} days')
    GROUP BY type
  `).all(...(deviceId ? [deviceId] : [])) as Array<{ type: string; total: number; avgConfidence: number; resolvedCount: number }>

  res.json({
    success: true,
    data: {
      period: `${periodDays}d`,
      anomaliesOverTime: anomalies,
      alertsOverTime: alerts,
      summary: summary.map(s => ({
        type: s.type,
        total: s.total,
        avgConfidence: parseFloat(s.avgConfidence.toFixed(2)),
        resolvedCount: s.resolvedCount,
        unresolvedCount: s.total - s.resolvedCount,
      })),
    },
  })
})

router.get('/rules', (_req: Request, res: Response): void => {
  res.json({ success: true, data: rulesState })
})

router.put('/rules/:id', (req: Request, res: Response): void => {
  const rule = rulesState.find(r => r.id === req.params.id)

  if (!rule) {
    res.status(404).json({ success: false, error: 'Rule not found' })
    return
  }

  const { threshold, sensitivity, enabled, timeRange } = req.body

  if (threshold !== undefined) rule.threshold = threshold
  if (sensitivity !== undefined) {
    if (!['low', 'medium', 'high'].includes(sensitivity)) {
      res.status(400).json({ success: false, error: 'sensitivity must be low, medium, or high' })
      return
    }
    rule.sensitivity = sensitivity
  }
  if (enabled !== undefined) rule.enabled = enabled
  if (timeRange !== undefined) rule.timeRange = timeRange

  res.json({ success: true, data: rule })
})

export default router
