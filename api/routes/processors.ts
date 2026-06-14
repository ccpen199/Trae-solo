import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, page = '1', pageSize = '10' } = req.query

    let sql = `SELECT p.*, (SELECT COUNT(*) FROM processor_audits a WHERE a.processor_id = p.id) as audit_count FROM processors p WHERE 1=1`
    const params: unknown[] = []

    if (status) {
      sql += ` AND p.status = ?`
      params.push(status)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM processors p WHERE 1=1${sql.split('WHERE 1=1')[1]?.split('ORDER')[0] || ''}`).get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const processors = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        list: processors,
        total: countRow.total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取处理商列表失败' })
  }
})

router.put('/:id/audit', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params
    const { status, reviewer, notes } = req.body

    if (!status) {
      res.status(400).json({ success: false, error: '缺少审核状态' })
      return
    }

    const processor = db.prepare(`SELECT * FROM processors WHERE id = ?`).get(id) as Record<string, unknown> | undefined
    if (!processor) {
      res.status(404).json({ success: false, error: '处理商不存在' })
      return
    }

    const statusFlow: Record<string, string[]> = {
      pending: ['initial_review'],
      initial_review: ['final_review', 'rejected'],
      final_review: ['approved', 'rejected'],
    }

    const currentStatus = processor.status as string
    const allowed = statusFlow[currentStatus]
    if (allowed && !allowed.includes(status)) {
      res.status(400).json({ success: false, error: `当前状态 ${currentStatus} 不允许变更为 ${status}` })
      return
    }

    db.prepare(`INSERT INTO processor_audits (id, processor_id, status, reviewer, notes) VALUES (?, ?, ?, ?, ?)`).run(
      uuidv4(), id, status, reviewer || null, notes || null
    )

    db.prepare(`UPDATE processors SET status = ? WHERE id = ?`).run(status, id)

    const updatedProcessor = db.prepare(`SELECT p.*, (SELECT COUNT(*) FROM processor_audits a WHERE a.processor_id = p.id) as audit_count FROM processors p WHERE p.id = ?`).get(id) as Record<string, unknown>
    const audits = db.prepare(`SELECT * FROM processor_audits WHERE processor_id = ? ORDER BY created_at DESC`).all(id)

    res.json({
      success: true,
      data: { ...updatedProcessor, audits },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '审核失败' })
  }
})

export default router
