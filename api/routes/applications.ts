import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

const STATUS_FLOW: Record<string, string> = {
  draft: 'submitted',
  submitted: 'village_review',
  village_review: 'township_review',
  township_review: 'supervisor_filing',
  supervisor_filing: 'approved',
}

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const keyword = (req.query.keyword as string) || ''
    const type = (req.query.type as string) || ''
    const status = (req.query.status as string) || ''
    const created_by = (req.query.created_by as string) || ''

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (keyword) {
      where += ' AND (a.app_code LIKE ? OR a.remarks LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (type) {
      where += ' AND a.type = ?'
      params.push(type)
    }
    if (status) {
      where += ' AND a.status = ?'
      params.push(status)
    }
    if (created_by) {
      where += ' AND a.created_by = ?'
      params.push(created_by)
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM applications a ${where}`).get(...params) as any).count
    const offset = (page - 1) * pageSize

    const list = db.prepare(
      `SELECT a.*, h.head_name, u.name as creator_name
       FROM applications a
       LEFT JOIN households h ON a.household_id = h.id
       LEFT JOIN users u ON a.created_by = u.id
       ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    res.json({
      success: true,
      data: { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取申请列表失败' })
  }
})

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const app = db.prepare(
      `SELECT a.*, h.head_name, p.parcel_code, u.name as creator_name
       FROM applications a
       LEFT JOIN households h ON a.household_id = h.id
       LEFT JOIN parcels p ON a.parcel_id = p.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = ?`
    ).get(req.params.id) as any

    if (!app) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const approvals = db.prepare(
      'SELECT ar.*, u.name as operator_name FROM approval_records ar LEFT JOIN users u ON ar.operator_id = u.id WHERE ar.application_id = ? ORDER BY ar.operated_at'
    ).all(req.params.id)

    res.json({ success: true, data: { ...app, approvals } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取申请详情失败' })
  }
})

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { household_id, parcel_id, type, materials, remarks } = req.body

    if (!household_id || !type) {
      res.status(400).json({ success: false, error: '缺少必要字段' })
      return
    }

    const count = (db.prepare('SELECT COUNT(*) as c FROM applications').get() as any).c
    const appCode = `SQ${new Date().getFullYear()}${String(count + 1).padStart(4, '0')}`

    const result = db.prepare(
      `INSERT INTO applications (app_code, household_id, parcel_id, type, status, materials, remarks, created_by)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`
    ).run(appCode, household_id, parcel_id || null, type, materials || '[]', remarks || '', req.user!.id)

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid, app_code: appCode } })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建申请失败' })
  }
})

router.post('/:id/submit', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any
    if (!app) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }
    if (app.status !== 'draft') {
      res.status(400).json({ success: false, error: '当前状态不允许提交' })
      return
    }

    db.prepare(
      `UPDATE applications SET status = 'submitted', updated_at = datetime('now') WHERE id = ?`
    ).run(req.params.id)

    res.json({ success: true, data: { id: req.params.id, status: 'submitted' } })
  } catch (error) {
    res.status(500).json({ success: false, error: '提交申请失败' })
  }
})

router.post('/:id/approve', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any
    if (!app) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const nextStatus = STATUS_FLOW[app.status]
    if (!nextStatus) {
      res.status(400).json({ success: false, error: '当前状态不允许审批通过' })
      return
    }

    const stageMap: Record<string, string> = {
      village_review: 'village_review',
      township_review: 'township_review',
      supervisor_filing: 'supervisor_filing',
    }

    const stage = stageMap[app.status]
    const { opinion } = req.body

    db.prepare(
      `UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(nextStatus, req.params.id)

    db.prepare(
      `INSERT INTO approval_records (application_id, stage, action, opinion, operator_id) VALUES (?, ?, 'approve', ?, ?)`
    ).run(parseInt(req.params.id), stage, opinion || '', req.user!.id)

    res.json({ success: true, data: { id: req.params.id, status: nextStatus } })
  } catch (error) {
    res.status(500).json({ success: false, error: '审批失败' })
  }
})

router.post('/:id/reject', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any
    if (!app) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const stageMap: Record<string, string> = {
      village_review: 'village_review',
      township_review: 'township_review',
      supervisor_filing: 'supervisor_filing',
    }

    const stage = stageMap[app.status]
    if (!stage) {
      res.status(400).json({ success: false, error: '当前状态不允许驳回' })
      return
    }

    const { opinion } = req.body

    db.prepare(
      `UPDATE applications SET status = 'rejected', updated_at = datetime('now') WHERE id = ?`
    ).run(req.params.id)

    db.prepare(
      `INSERT INTO approval_records (application_id, stage, action, opinion, operator_id) VALUES (?, ?, 'reject', ?, ?)`
    ).run(parseInt(req.params.id), stage, opinion || '', req.user!.id)

    res.json({ success: true, data: { id: req.params.id, status: 'rejected' } })
  } catch (error) {
    res.status(500).json({ success: false, error: '驳回失败' })
  }
})

router.post('/:id/return', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any
    if (!app) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const stageMap: Record<string, string> = {
      village_review: 'village_review',
      township_review: 'township_review',
      supervisor_filing: 'supervisor_filing',
    }

    const stage = stageMap[app.status]
    if (!stage) {
      res.status(400).json({ success: false, error: '当前状态不允许退回' })
      return
    }

    const { opinion } = req.body

    db.prepare(
      `UPDATE applications SET status = 'returned', updated_at = datetime('now') WHERE id = ?`
    ).run(req.params.id)

    db.prepare(
      `INSERT INTO approval_records (application_id, stage, action, opinion, operator_id) VALUES (?, ?, 'return', ?, ?)`
    ).run(parseInt(req.params.id), stage, opinion || '', req.user!.id)

    res.json({ success: true, data: { id: req.params.id, status: 'returned' } })
  } catch (error) {
    res.status(500).json({ success: false, error: '退回失败' })
  }
})

router.post('/:id/materials', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any
    if (!app) {
      res.status(404).json({ success: false, error: '申请不存在' })
      return
    }

    const { materials } = req.body
    if (!materials) {
      res.status(400).json({ success: false, error: '缺少材料数据' })
      return
    }

    db.prepare(
      `UPDATE applications SET materials = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(JSON.stringify(materials), req.params.id)

    res.json({ success: true, data: { id: req.params.id } })
  } catch (error) {
    res.status(500).json({ success: false, error: '补充材料失败' })
  }
})

export default router
