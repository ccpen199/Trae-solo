import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { getDb } from '../database.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const cabinets = db.prepare(`
      SELECT c.*,
        COUNT(cmp.id) as actual_compartments,
        SUM(CASE WHEN cmp.status = 'available' THEN 1 ELSE 0 END) as available_count,
        SUM(CASE WHEN cmp.status = 'occupied' THEN 1 ELSE 0 END) as occupied_count,
        SUM(CASE WHEN cmp.status = 'reserved' THEN 1 ELSE 0 END) as reserved_count,
        SUM(CASE WHEN cmp.status = 'fault' THEN 1 ELSE 0 END) as fault_count
      FROM cabinets c
      LEFT JOIN compartments cmp ON cmp.cabinet_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all()

    res.json({ success: true, data: cabinets })
  } catch (error) {
    console.error('List cabinets error:', error)
    res.status(500).json({ success: false, error: '获取柜子列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const cabinet = db.prepare('SELECT * FROM cabinets WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!cabinet) {
      res.status(404).json({ success: false, error: '柜子不存在' })
      return
    }

    const compartments = db.prepare('SELECT * FROM compartments WHERE cabinet_id = ? ORDER BY code').all(req.params.id)
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN status = 'fault' THEN 1 ELSE 0 END) as fault
      FROM compartments WHERE cabinet_id = ?
    `).get(req.params.id) as Record<string, number>

    res.json({
      success: true,
      data: {
        ...cabinet,
        compartments,
        stats,
      },
    })
  } catch (error) {
    console.error('Get cabinet error:', error)
    res.status(500).json({ success: false, error: '获取柜子详情失败' })
  }
})

router.post('/', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const { name, location, address, status } = req.body
    if (!name) {
      res.status(400).json({ success: false, error: '柜子名称为必填项' })
      return
    }

    const db = getDb()
    const id = uuidv4()
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    db.prepare(`
      INSERT INTO cabinets (id, name, location, address, status, total_compartments, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, name, location || '', address || '', status || 'online', now, now)

    const cabinet = db.prepare('SELECT * FROM cabinets WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: cabinet })
  } catch (error) {
    console.error('Create cabinet error:', error)
    res.status(500).json({ success: false, error: '创建柜子失败' })
  }
})

router.put('/:id', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const cabinet = db.prepare('SELECT * FROM cabinets WHERE id = ?').get(req.params.id)
    if (!cabinet) {
      res.status(404).json({ success: false, error: '柜子不存在' })
      return
    }

    const { name, location, address, status } = req.body
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    db.prepare(`
      UPDATE cabinets SET name = COALESCE(?, name), location = COALESCE(?, location),
        address = COALESCE(?, address), status = COALESCE(?, status), updated_at = ?
      WHERE id = ?
    `).run(name || null, location || null, address || null, status || null, now, req.params.id)

    const updated = db.prepare('SELECT * FROM cabinets WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update cabinet error:', error)
    res.status(500).json({ success: false, error: '更新柜子失败' })
  }
})

router.get('/:id/occupancy', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const cabinet = db.prepare('SELECT * FROM cabinets WHERE id = ?').get(req.params.id)
    if (!cabinet) {
      res.status(404).json({ success: false, error: '柜子不存在' })
      return
    }

    const totalStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN status = 'fault' THEN 1 ELSE 0 END) as fault
      FROM compartments WHERE cabinet_id = ?
    `).get(req.params.id) as Record<string, number>

    const total = totalStats.total || 0
    const occupied = totalStats.occupied || 0
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 10000) / 100 : 0

    const sizeStats = db.prepare(`
      SELECT size,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied
      FROM compartments WHERE cabinet_id = ?
      GROUP BY size
    `).all(req.params.id) as Array<{ size: string; total: number; available: number; occupied: number }>

    const sizeOccupancy = sizeStats.map(s => ({
      ...s,
      rate: s.total > 0 ? Math.round((s.occupied / s.total) * 10000) / 100 : 0,
    }))

    res.json({
      success: true,
      data: {
        cabinet_id: req.params.id,
        total,
        available: totalStats.available || 0,
        occupied,
        reserved: totalStats.reserved || 0,
        fault: totalStats.fault || 0,
        occupancy_rate: occupancyRate,
        by_size: sizeOccupancy,
      },
    })
  } catch (error) {
    console.error('Get occupancy error:', error)
    res.status(500).json({ success: false, error: '获取使用率统计失败' })
  }
})

export default router
