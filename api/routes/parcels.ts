import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const keyword = (req.query.keyword as string) || ''
    const usage = (req.query.usage as string) || ''
    const ownership_status = (req.query.ownership_status as string) || ''
    const household_id = (req.query.household_id as string) || ''

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (keyword) {
      where += ' AND (p.parcel_code LIKE ? OR p.ownership_cert LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (usage) {
      where += ' AND p.usage = ?'
      params.push(usage)
    }
    if (ownership_status) {
      where += ' AND p.ownership_status = ?'
      params.push(ownership_status)
    }
    if (household_id) {
      where += ' AND p.household_id = ?'
      params.push(household_id)
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM parcels p ${where}`).get(...params) as any).count
    const offset = (page - 1) * pageSize

    const list = db.prepare(
      `SELECT p.*, h.head_name FROM parcels p LEFT JOIN households h ON p.household_id = h.id ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    res.json({
      success: true,
      data: { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取地块列表失败' })
  }
})

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const parcel = db.prepare(
      'SELECT p.*, h.head_name FROM parcels p LEFT JOIN households h ON p.household_id = h.id WHERE p.id = ?'
    ).get(req.params.id) as any

    if (!parcel) {
      res.status(404).json({ success: false, error: '地块不存在' })
      return
    }

    const changes = db.prepare(
      'SELECT * FROM parcel_changes WHERE parcel_id = ? ORDER BY changed_at DESC'
    ).all(req.params.id)

    res.json({ success: true, data: { parcel, changes } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取地块详情失败' })
  }
})

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const {
      household_id, parcel_code, coordinates, area, usage,
      ownership_cert, ownership_status, boundary_east, boundary_west,
      boundary_south, boundary_north, photos,
    } = req.body

    if (!household_id || !parcel_code || !area || !usage) {
      res.status(400).json({ success: false, error: '缺少必要字段' })
      return
    }

    const existing = db.prepare('SELECT id FROM parcels WHERE parcel_code = ?').get(parcel_code)
    if (existing) {
      res.status(409).json({ success: false, error: '地块编码已存在' })
      return
    }

    const result = db.prepare(
      `INSERT INTO parcels (household_id, parcel_code, coordinates, area, usage, ownership_cert, ownership_status, boundary_east, boundary_west, boundary_south, boundary_north, photos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      household_id, parcel_code, coordinates || null, area, usage,
      ownership_cert || null, ownership_status || 'unconfirmed',
      boundary_east || null, boundary_west || null,
      boundary_south || null, boundary_north || null,
      photos || '[]'
    )

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建地块失败' })
  }
})

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const parcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(req.params.id) as any
    if (!parcel) {
      res.status(404).json({ success: false, error: '地块不存在' })
      return
    }

    const {
      household_id, parcel_code, coordinates, area, usage,
      ownership_cert, ownership_status, boundary_east, boundary_west,
      boundary_south, boundary_north, photos,
    } = req.body

    if (parcel_code && parcel_code !== parcel.parcel_code) {
      const dup = db.prepare('SELECT id FROM parcels WHERE parcel_code = ? AND id != ?').get(parcel_code, req.params.id)
      if (dup) {
        res.status(409).json({ success: false, error: '地块编码已存在' })
        return
      }
    }

    db.prepare(
      `UPDATE parcels SET household_id = ?, parcel_code = ?, coordinates = ?, area = ?, usage = ?,
       ownership_cert = ?, ownership_status = ?, boundary_east = ?, boundary_west = ?,
       boundary_south = ?, boundary_north = ?, photos = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      household_id || parcel.household_id,
      parcel_code || parcel.parcel_code,
      coordinates !== undefined ? coordinates : parcel.coordinates,
      area || parcel.area,
      usage || parcel.usage,
      ownership_cert !== undefined ? ownership_cert : parcel.ownership_cert,
      ownership_status || parcel.ownership_status,
      boundary_east !== undefined ? boundary_east : parcel.boundary_east,
      boundary_west !== undefined ? boundary_west : parcel.boundary_west,
      boundary_south !== undefined ? boundary_south : parcel.boundary_south,
      boundary_north !== undefined ? boundary_north : parcel.boundary_north,
      photos || parcel.photos,
      req.params.id
    )

    res.json({ success: true, data: { id: req.params.id } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新地块失败' })
  }
})

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const parcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(req.params.id) as any
    if (!parcel) {
      res.status(404).json({ success: false, error: '地块不存在' })
      return
    }

    db.prepare('DELETE FROM parcels WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除地块失败' })
  }
})

router.post('/:id/changes', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const parcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(req.params.id) as any
    if (!parcel) {
      res.status(404).json({ success: false, error: '地块不存在' })
      return
    }

    const { change_type, description } = req.body
    if (!change_type || !description) {
      res.status(400).json({ success: false, error: '缺少必要字段' })
      return
    }

    const result = db.prepare(
      `INSERT INTO parcel_changes (parcel_id, change_type, description, changed_by) VALUES (?, ?, ?, ?)`
    ).run(parseInt(req.params.id), change_type, description, req.user!.name)

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error) {
    res.status(500).json({ success: false, error: '添加变更记录失败' })
  }
})

export default router
