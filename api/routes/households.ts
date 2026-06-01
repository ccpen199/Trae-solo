import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const keyword = (req.query.keyword as string) || ''
    const status = (req.query.status as string) || ''

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (keyword) {
      where += ' AND (h.head_name LIKE ? OR h.id_card LIKE ? OR h.phone LIKE ? OR h.address LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (status) {
      where += ' AND h.eligibility_status = ?'
      params.push(status)
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM households h ${where}`).get(...params) as any).count
    const offset = (page - 1) * pageSize

    const list = db.prepare(
      `SELECT h.*, u.name as creator_name FROM households h LEFT JOIN users u ON h.created_by = u.id ${where} ORDER BY h.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    res.json({
      success: true,
      data: { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取农户列表失败' })
  }
})

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const household = db.prepare(
      'SELECT h.*, u.name as creator_name FROM households h LEFT JOIN users u ON h.created_by = u.id WHERE h.id = ?'
    ).get(req.params.id) as any

    if (!household) {
      res.status(404).json({ success: false, error: '农户不存在' })
      return
    }

    const members = db.prepare(
      'SELECT * FROM household_members WHERE household_id = ? ORDER BY created_at'
    ).all(req.params.id)

    const parcels = db.prepare(
      'SELECT id, parcel_code, area, usage, ownership_status FROM parcels WHERE household_id = ?'
    ).all(req.params.id)

    const applications = db.prepare(
      'SELECT id, app_code, type, status, created_at FROM applications WHERE household_id = ? ORDER BY created_at DESC'
    ).all(req.params.id)

    res.json({ success: true, data: { household, members, parcels, applications } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取农户详情失败' })
  }
})

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { head_name, id_card, address, phone, eligibility_status, members } = req.body

    if (!head_name || !id_card || !address || !phone) {
      res.status(400).json({ success: false, error: '缺少必要字段' })
      return
    }

    const existing = db.prepare('SELECT id FROM households WHERE id_card = ?').get(id_card)
    if (existing) {
      res.status(409).json({ success: false, error: '身份证号已存在' })
      return
    }

    const result = db.prepare(
      `INSERT INTO households (head_name, id_card, address, phone, eligibility_status, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(head_name, id_card, address, phone, eligibility_status || 'qualified', req.user!.id)

    const householdId = result.lastInsertRowid

    if (Array.isArray(members) && members.length > 0) {
      const insertMember = db.prepare(
        'INSERT INTO household_members (household_id, name, relationship, id_card, household_registration) VALUES (?, ?, ?, ?, ?)'
      )
      for (const m of members) {
        insertMember.run(householdId, m.name, m.relationship, m.id_card, m.household_registration)
      }
    }

    res.status(201).json({ success: true, data: { id: householdId } })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建农户失败' })
  }
})

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { head_name, id_card, address, phone, eligibility_status } = req.body
    const household = db.prepare('SELECT * FROM households WHERE id = ?').get(req.params.id) as any

    if (!household) {
      res.status(404).json({ success: false, error: '农户不存在' })
      return
    }

    if (id_card && id_card !== household.id_card) {
      const dup = db.prepare('SELECT id FROM households WHERE id_card = ? AND id != ?').get(id_card, req.params.id)
      if (dup) {
        res.status(409).json({ success: false, error: '身份证号已被其他农户使用' })
        return
      }
    }

    db.prepare(
      `UPDATE households SET head_name = ?, id_card = ?, address = ?, phone = ?, eligibility_status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      head_name || household.head_name,
      id_card || household.id_card,
      address || household.address,
      phone || household.phone,
      eligibility_status || household.eligibility_status,
      req.params.id
    )

    res.json({ success: true, data: { id: req.params.id } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新农户失败' })
  }
})

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const household = db.prepare('SELECT * FROM households WHERE id = ?').get(req.params.id) as any
    if (!household) {
      res.status(404).json({ success: false, error: '农户不存在' })
      return
    }

    db.prepare('DELETE FROM households WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除农户失败' })
  }
})

router.post('/:id/members', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const household = db.prepare('SELECT * FROM households WHERE id = ?').get(req.params.id) as any
    if (!household) {
      res.status(404).json({ success: false, error: '农户不存在' })
      return
    }

    const { name, relationship, id_card, household_registration } = req.body
    if (!name || !relationship || !id_card) {
      res.status(400).json({ success: false, error: '缺少必要字段' })
      return
    }

    const result = db.prepare(
      'INSERT INTO household_members (household_id, name, relationship, id_card, household_registration) VALUES (?, ?, ?, ?, ?)'
    ).run(parseInt(req.params.id), name, relationship, id_card, household_registration || '')

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error) {
    res.status(500).json({ success: false, error: '添加成员失败' })
  }
})

router.delete('/:householdId/members/:memberId', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const member = db.prepare(
      'SELECT * FROM household_members WHERE id = ? AND household_id = ?'
    ).get(req.params.memberId, req.params.householdId) as any

    if (!member) {
      res.status(404).json({ success: false, error: '成员不存在' })
      return
    }

    db.prepare('DELETE FROM household_members WHERE id = ?').run(req.params.memberId)
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除成员失败' })
  }
})

export default router
