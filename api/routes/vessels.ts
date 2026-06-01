import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { search = '', status = '', page = '1', pageSize = '10' } = req.query
    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Number(pageSize))
    const offset = (pageNum - 1) * pageSizeNum

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (search) {
      where += ' AND (name LIKE ? OR code LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    if (status) {
      where += ' AND status = ?'
      params.push(status)
    }

    const countRow = db.prepare(`SELECT COUNT(*) AS total FROM vessels ${where}`).get(...params) as { total: number }
    const rows = db.prepare(`SELECT * FROM vessels ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, pageSizeNum, offset) as any[]

    res.json({ success: true, data: { list: rows, total: countRow.total, page: pageNum, pageSize: pageSizeNum } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const vessel = db.prepare('SELECT * FROM vessels WHERE id = ?').get(req.params.id)
    if (!vessel) {
      res.status(404).json({ success: false, error: '船只不存在' })
      return
    }
    const certificates = db.prepare('SELECT * FROM certificates WHERE vessel_id = ?').all(req.params.id)
    res.json({ success: true, data: { ...(vessel as any), certificates } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { name, code, owner_name, owner_phone, vessel_type, fishing_type, gps_device, gps_status, safety_device, safety_status, status } = req.body
    if (!name || !code || !owner_name || !vessel_type || !fishing_type) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const result = db.prepare(`
      INSERT INTO vessels (name, code, owner_name, owner_phone, vessel_type, fishing_type, gps_device, gps_status, safety_device, safety_status, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, code, owner_name, owner_phone || '', vessel_type, fishing_type, gps_device || '', gps_status || '正常', safety_device || '', safety_status || '正常', status || '在港')
    res.json({ success: true, data: { id: Number(result.lastInsertRowid) } })
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(400).json({ success: false, error: '船只编号已存在' })
      return
    }
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM vessels WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: '船只不存在' })
      return
    }
    const { name, code, owner_name, owner_phone, vessel_type, fishing_type, gps_device, gps_status, safety_device, safety_status, status } = req.body
    db.prepare(`
      UPDATE vessels SET name=?, code=?, owner_name=?, owner_phone=?, vessel_type=?, fishing_type=?, gps_device=?, gps_status=?, safety_device=?, safety_status=?, status=?, updated_at=datetime('now','localtime')
      WHERE id=?
    `).run(
      name ?? (existing as any).name,
      code ?? (existing as any).code,
      owner_name ?? (existing as any).owner_name,
      owner_phone ?? (existing as any).owner_phone,
      vessel_type ?? (existing as any).vessel_type,
      fishing_type ?? (existing as any).fishing_type,
      gps_device ?? (existing as any).gps_device,
      gps_status ?? (existing as any).gps_status,
      safety_device ?? (existing as any).safety_device,
      safety_status ?? (existing as any).safety_status,
      status ?? (existing as any).status,
      req.params.id
    )
    res.json({ success: true, message: '更新成功' })
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(400).json({ success: false, error: '船只编号已存在' })
      return
    }
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const vessel = db.prepare('SELECT * FROM vessels WHERE id = ?').get(req.params.id) as any
    if (!vessel) {
      res.status(404).json({ success: false, error: '船只不存在' })
      return
    }
    if (vessel.status !== '在港') {
      res.status(400).json({ success: false, error: '只有"在港"状态的船只可以删除' })
      return
    }
    db.prepare('DELETE FROM certificates WHERE vessel_id = ?').run(req.params.id)
    db.prepare('DELETE FROM vessels WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id/certificates', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const certs = db.prepare('SELECT * FROM certificates WHERE vessel_id = ? ORDER BY id DESC').all(req.params.id)
    res.json({ success: true, data: certs })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/certificates', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const vessel = db.prepare('SELECT * FROM vessels WHERE id = ?').get(req.params.id)
    if (!vessel) {
      res.status(404).json({ success: false, error: '船只不存在' })
      return
    }
    const { cert_type, cert_number, issue_date, expiry_date, status } = req.body
    if (!cert_type || !cert_number || !issue_date || !expiry_date) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const result = db.prepare(`
      INSERT INTO certificates (vessel_id, cert_type, cert_number, issue_date, expiry_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.id, cert_type, cert_number, issue_date, expiry_date, status || '有效')
    res.json({ success: true, data: { id: Number(result.lastInsertRowid) } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/certificates/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: '证书不存在' })
      return
    }
    const { cert_type, cert_number, issue_date, expiry_date, status } = req.body
    db.prepare(`
      UPDATE certificates SET cert_type=?, cert_number=?, issue_date=?, expiry_date=?, status=?
      WHERE id=?
    `).run(
      cert_type ?? (existing as any).cert_type,
      cert_number ?? (existing as any).cert_number,
      issue_date ?? (existing as any).issue_date,
      expiry_date ?? (existing as any).expiry_date,
      status ?? (existing as any).status,
      req.params.id
    )
    res.json({ success: true, message: '更新成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
