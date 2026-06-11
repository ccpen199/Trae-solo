import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const conditions: string[] = []
    const params: any[] = []

    if (status) { conditions.push('d.status = ?'); params.push(status) }
    if (type) { conditions.push('d.type = ?'); params.push(type) }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const total = (db.prepare(`SELECT COUNT(*) as c FROM devices d ${where}`).get(params) as any).c
    const rows = db.prepare(
      `SELECT d.*, o.name as org_name FROM devices d LEFT JOIN organizations o ON d.organization_id = o.id ${where} ORDER BY d.updated_at DESC LIMIT ? OFFSET ?`
    ).all(...params, ps, (p - 1) * ps)

    res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/heartbeat/stats', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const online = (db.prepare("SELECT COUNT(*) as c FROM devices WHERE status = 'online'").get() as any).c
    const offline = (db.prepare("SELECT COUNT(*) as c FROM devices WHERE status = 'offline'").get() as any).c
    const maintenance = (db.prepare("SELECT COUNT(*) as c FROM devices WHERE status = 'maintenance'").get() as any).c
    const total = online + offline + maintenance
    const onlineRate = total > 0 ? Math.round((online / total) * 10000) / 100 : 0

    res.json({ success: true, data: { online, offline, maintenance, total, onlineRate } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/offline', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const total = (db.prepare('SELECT COUNT(*) as c FROM offline_cache').get() as any).c
    const rows = db.prepare(
      'SELECT oc.*, d.name as device_name FROM offline_cache oc LEFT JOIN devices d ON oc.device_id = d.id ORDER BY oc.created_at DESC LIMIT ? OFFSET ?'
    ).all(ps, (p - 1) * ps)

    res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/offline/sync', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = db.prepare("UPDATE offline_cache SET synced = 1, synced_at = datetime('now','localtime') WHERE synced = 0").run()
    res.json({ success: true, data: { syncedCount: result.changes } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const row = db.prepare(
      'SELECT d.*, o.name as org_name FROM devices d LEFT JOIN organizations o ON d.organization_id = o.id WHERE d.id = ?'
    ).get(req.params.id) as any

    if (!row) {
      res.status(404).json({ success: false, error: '设备不存在' })
      return
    }

    const alerts = db.prepare('SELECT * FROM device_alerts WHERE device_id = ? ORDER BY created_at DESC LIMIT 10').all(row.id)
    res.json({ success: true, data: { ...row, alerts } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, status, location, firmware_version } = req.body
    const device = db.prepare('SELECT id FROM devices WHERE id = ?').get(req.params.id) as any
    if (!device) {
      res.status(404).json({ success: false, error: '设备不存在' })
      return
    }

    db.prepare(
      "UPDATE devices SET name = COALESCE(?,name), status = COALESCE(?,status), location = COALESCE(?,location), firmware_version = COALESCE(?,firmware_version), updated_at = datetime('now','localtime') WHERE id = ?"
    ).run(name || null, status || null, location || null, firmware_version || null, req.params.id)

    const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/ota', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { version } = req.body
    const device = db.prepare('SELECT id, name FROM devices WHERE id = ?').get(req.params.id) as any
    if (!device) {
      res.status(404).json({ success: false, error: '设备不存在' })
      return
    }

    db.prepare(
      "UPDATE devices SET firmware_version = ?, updated_at = datetime('now','localtime') WHERE id = ?"
    ).run(version || 'v3.0.0', req.params.id)

    res.json({ success: true, data: { message: `设备 ${device.name} OTA升级已推送`, version: version || 'v3.0.0' } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
