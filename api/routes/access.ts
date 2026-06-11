import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/records', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { mode, user_id, device_id, start_date, end_date, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const conditions: string[] = []
    const params: any[] = []

    if (mode) { conditions.push('ar.mode = ?'); params.push(mode) }
    if (user_id) { conditions.push('ar.user_id = ?'); params.push(user_id) }
    if (device_id) { conditions.push('ar.device_id = ?'); params.push(device_id) }
    if (start_date) { conditions.push('ar.created_at >= ?'); params.push(start_date) }
    if (end_date) { conditions.push('ar.created_at <= ?'); params.push(end_date + ' 23:59:59') }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const total = (db.prepare(`SELECT COUNT(*) as c FROM access_records ar ${where}`).get(params) as any).c
    const rows = db.prepare(
      `SELECT ar.*, u.name as user_name, d.name as device_name, d.type as device_type
       FROM access_records ar
       LEFT JOIN users u ON ar.user_id = u.id
       LEFT JOIN devices d ON ar.device_id = d.id
       ${where} ORDER BY ar.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, ps, (p - 1) * ps)

    res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/unlock', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { device_id, mode = 'bluetooth', direction = 'in' } = req.body
    if (!device_id) {
      res.status(400).json({ success: false, error: '设备ID不能为空' })
      return
    }

    const device = db.prepare('SELECT id, status FROM devices WHERE id = ?').get(device_id) as any
    if (!device) {
      res.status(404).json({ success: false, error: '设备不存在' })
      return
    }

    const success = device.status === 'online' ? 1 : 0
    const result = db.prepare(
      'INSERT INTO access_records (user_id, device_id, mode, direction, success) VALUES (?,?,?,?,?)'
    ).run(req.user!.id, device_id, mode, direction, success)

    const record = db.prepare('SELECT * FROM access_records WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: record })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/visitor', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { device_id, visitor_name, valid_until } = req.body
    if (!device_id) {
      res.status(400).json({ success: false, error: '设备ID不能为空' })
      return
    }

    const code = 'VC' + Date.now()
    const result = db.prepare(
      'INSERT INTO access_records (device_id, mode, direction, success, visitor_code) VALUES (?,?,?,?,?)'
    ).run(device_id, 'qrcode', 'in', 1, code)

    res.json({ success: true, data: { code, record_id: result.lastInsertRowid, visitor_name, valid_until } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/visitor', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = db.prepare(
      `SELECT ar.*, d.name as device_name FROM access_records ar
       LEFT JOIN devices d ON ar.device_id = d.id
       WHERE ar.visitor_code IS NOT NULL ORDER BY ar.created_at DESC`
    ).all()
    res.json({ success: true, data: rows })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
