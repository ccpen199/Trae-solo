import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const keyword = (req.query.keyword as string) || ''
    const anomaly_type = (req.query.anomaly_type as string) || ''
    const rectify_status = (req.query.rectify_status as string) || ''

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (keyword) {
      where += ' AND (a.description LIKE ?)'
      params.push(`%${keyword}%`)
    }
    if (anomaly_type) {
      where += ' AND a.anomaly_type = ?'
      params.push(anomaly_type)
    }
    if (rectify_status) {
      where += ' AND a.rectify_status = ?'
      params.push(rectify_status)
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM anomalies a ${where}`).get(...params) as any).count
    const offset = (page - 1) * pageSize

    const list = db.prepare(
      `SELECT a.*, h.head_name, p.parcel_code
       FROM anomalies a
       LEFT JOIN households h ON a.household_id = h.id
       LEFT JOIN parcels p ON a.parcel_id = p.id
       ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    res.json({
      success: true,
      data: { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取异常列表失败' })
  }
})

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const anomaly = db.prepare(
      `SELECT a.*, h.head_name, p.parcel_code
       FROM anomalies a
       LEFT JOIN households h ON a.household_id = h.id
       LEFT JOIN parcels p ON a.parcel_id = p.id
       WHERE a.id = ?`
    ).get(req.params.id) as any

    if (!anomaly) {
      res.status(404).json({ success: false, error: '异常记录不存在' })
      return
    }

    const records = db.prepare(
      'SELECT rr.*, u.name as operator_name FROM rectify_records rr LEFT JOIN users u ON rr.operator_id = u.id WHERE rr.anomaly_id = ? ORDER BY rr.operated_at'
    ).all(req.params.id)

    res.json({ success: true, data: { ...anomaly, records } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取异常详情失败' })
  }
})

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { anomaly_type, household_id, parcel_id, application_id, description, rectify_requirement, deadline } = req.body

    if (!anomaly_type || !description) {
      res.status(400).json({ success: false, error: '缺少必要字段' })
      return
    }

    const result = db.prepare(
      `INSERT INTO anomalies (anomaly_type, household_id, parcel_id, application_id, description, rectify_status, rectify_requirement, deadline, created_by)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
    ).run(
      anomaly_type,
      household_id || null,
      parcel_id || null,
      application_id || null,
      description,
      rectify_requirement || null,
      deadline || null,
      req.user!.id
    )

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建异常记录失败' })
  }
})

router.post('/:id/rectify', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const anomaly = db.prepare('SELECT * FROM anomalies WHERE id = ?').get(req.params.id) as any
    if (!anomaly) {
      res.status(404).json({ success: false, error: '异常记录不存在' })
      return
    }

    const { action, result: rectifyResult, deadline } = req.body
    if (!action) {
      res.status(400).json({ success: false, error: '缺少整改动作' })
      return
    }

    let newStatus = anomaly.rectify_status
    if (action === 'start_rectify') {
      newStatus = 'in_progress'
    } else if (action === 'complete_rectify') {
      newStatus = 'completed'
    } else if (action === 'mark_overdue') {
      newStatus = 'overdue'
    }

    db.prepare(
      `UPDATE anomalies SET rectify_status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(newStatus, req.params.id)

    db.prepare(
      `INSERT INTO rectify_records (anomaly_id, action, result, deadline, operator_id) VALUES (?, ?, ?, ?, ?)`
    ).run(parseInt(req.params.id), action, rectifyResult || null, deadline || null, req.user!.id)

    res.json({ success: true, data: { id: req.params.id, rectify_status: newStatus } })
  } catch (error) {
    res.status(500).json({ success: false, error: '添加整改记录失败' })
  }
})

export default router
