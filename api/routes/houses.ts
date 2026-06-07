import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { auditLog } from '../middleware/audit.js'

const router = Router()

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status, unit_type, minPrice, maxPrice, houseType,
      community, keyword, page = '1', pageSize = '10',
    } = req.query as any

    const conditions: string[] = ["h.status != 'offline'"]
    const params: any[] = []

    if (status) { conditions.push('h.status = ?'); params.push(status) }
    if (unit_type) { conditions.push('h.unit_type = ?'); params.push(unit_type) }
    if (minPrice) { conditions.push('h.price >= ?'); params.push(Number(minPrice)) }
    if (maxPrice) { conditions.push('h.price <= ?'); params.push(Number(maxPrice)) }
    if (houseType) { conditions.push('h.house_type = ?'); params.push(houseType) }
    if (community) { conditions.push('h.community LIKE ?'); params.push(`%${community}%`) }
    if (keyword) {
      conditions.push('(h.title LIKE ? OR h.address LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    if (req.user!.role === 'agent') {
      conditions.push('h.agent_id = ?')
      params.push(req.user!.id)
    } else if (req.user!.role === 'manager') {
      conditions.push('h.agent_id IN (SELECT id FROM users WHERE org_id = ?)')
      params.push(req.user!.org_id)
    }

    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Math.min(100, Number(pageSize)))
    const offset = (pageNum - 1) * pageSizeNum
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM houses h ${where}`).get(...params) as { count: number }
    const rows = db.prepare(
      `SELECT h.*, u.name as agent_name
       FROM houses h LEFT JOIN users u ON h.agent_id = u.id
       ${where}
       ORDER BY h.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSizeNum, offset) as any[]

    res.json({ success: true, data: rows, total: totalRow.count, page: pageNum, pageSize: pageSizeNum })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', authenticate, auditLog('create', 'house'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title, address, lng, lat, price, unitType, houseType,
      area, floorInfo, orientation, decoration, description,
      community, builtYear, images,
    } = req.body

    if (!title || !address) {
      res.status(400).json({ success: false, error: '标题和地址为必填项' })
      return
    }

    const result = db.prepare(
      `INSERT INTO houses (title, address, lng, lat, price, unit_type, house_type, area, floor_info, orientation, decoration, description, community, built_year, images, agent_id, cert_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).run(
      title, address, lng || null, lat || null, price || null,
      unitType || 'sell', houseType || null, area || null, floorInfo || null,
      orientation || null, decoration || null, description || null,
      community || null, builtYear || null, JSON.stringify(images || []),
      req.user!.id
    )

    const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(result.lastInsertRowid) as any
    res.status(201).json({ success: true, data: house })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/nearby/list', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lng, lat } = req.query as any
    if (!lng || !lat) {
      res.status(400).json({ success: false, error: '经纬度参数为必填项' })
      return
    }

    const lngNum = Number(lng)
    const latNum = Number(lat)

    const rows = db.prepare(
      `SELECT h.*, u.name as agent_name
       FROM houses h LEFT JOIN users u ON h.agent_id = u.id
       WHERE h.status != 'offline' AND h.lat IS NOT NULL AND h.lng IS NOT NULL`
    ).all() as any[]

    function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371
      const rLat1 = lat1 * Math.PI / 180
      const rLat2 = lat2 * Math.PI / 180
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(rLat1) * Math.cos(rLat2) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    const withDistance = rows
      .map((h: any) => ({ ...h, distance: calcDistance(latNum, lngNum, h.lat, h.lng) }))
      .filter((h: any) => h.distance <= 50)
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, 20)

    res.json({ success: true, data: withDistance })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const house = db.prepare(
      `SELECT h.*, u.name as agent_name, u.phone as agent_phone
       FROM houses h LEFT JOIN users u ON h.agent_id = u.id
       WHERE h.id = ?`
    ).get(Number(req.params.id)) as any

    if (!house) {
      res.status(404).json({ success: false, error: '房源不存在' })
      return
    }
    res.json({ success: true, data: house })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', authenticate, auditLog('update', 'house'), async (req: Request, res: Response): Promise<void> => {
  try {
    const houseId = Number(req.params.id)
    const house = db.prepare('SELECT agent_id FROM houses WHERE id = ?').get(houseId) as any
    if (!house) {
      res.status(404).json({ success: false, error: '房源不存在' })
      return
    }

    const isOwner = house.agent_id === req.user!.id
    const isPrivileged = ['director', 'manager'].includes(req.user!.role)
    if (!isOwner && !isPrivileged) {
      res.status(403).json({ success: false, error: '无权修改此房源' })
      return
    }

    const fields: string[] = []
    const params: any[] = []
    const allowedFields: Record<string, string> = {
      title: 'title', address: 'address', lng: 'lng', lat: 'lat',
      price: 'price', unitType: 'unit_type', houseType: 'house_type',
      area: 'area', floorInfo: 'floor_info', orientation: 'orientation',
      decoration: 'decoration', description: 'description',
      community: 'community', builtYear: 'built_year', images: 'images',
      status: 'status',
    }

    for (const [bodyKey, colKey] of Object.entries(allowedFields)) {
      if (req.body[bodyKey] !== undefined) {
        fields.push(`${colKey} = ?`)
        params.push(bodyKey === 'images' ? JSON.stringify(req.body[bodyKey]) : req.body[bodyKey])
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    params.push(houseId)
    db.prepare(`UPDATE houses SET ${fields.join(', ')} WHERE id = ?`).run(...params)

    const updated = db.prepare('SELECT * FROM houses WHERE id = ?').get(houseId) as any
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', authenticate, requireRole('director', 'manager', 'admin'), auditLog('delete', 'house'), async (req: Request, res: Response): Promise<void> => {
  try {
    const houseId = Number(req.params.id)
    const house = db.prepare('SELECT id FROM houses WHERE id = ?').get(houseId) as any
    if (!house) {
      res.status(404).json({ success: false, error: '房源不存在' })
      return
    }

    db.prepare("UPDATE houses SET status = 'offline', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(houseId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/verify', authenticate, requireRole('director', 'manager', 'admin'), auditLog('verify', 'house'), async (req: Request, res: Response): Promise<void> => {
  try {
    const houseId = Number(req.params.id)
    const house = db.prepare('SELECT id FROM houses WHERE id = ?').get(houseId) as any
    if (!house) {
      res.status(404).json({ success: false, error: '房源不存在' })
      return
    }

    const verified = Math.random() > 0.3
    if (verified) {
      const certNo = `BJ-CQ-${new Date().getFullYear()}-${String(houseId).padStart(4, '0')}`
      db.prepare(
        "UPDATE houses SET cert_status = 'verified', cert_no = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(certNo, houseId)
    } else {
      db.prepare(
        "UPDATE houses SET cert_status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(houseId)
    }

    const updated = db.prepare('SELECT id, cert_status, cert_no FROM houses WHERE id = ?').get(houseId) as any
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
