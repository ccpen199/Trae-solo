import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/queue', (req: Request, res: Response): void => {
  const db = getDb()
  const {
    stage,
    province,
    city,
    page = '1',
    limit = '20',
  } = req.query

  const conditions: string[] = []
  const params: unknown[] = []

  if (stage) {
    conditions.push('ar.stage = ?')
    params.push(stage)
  }
  if (province) {
    conditions.push('p.province = ?')
    params.push(province)
  }
  if (city) {
    conditions.push('p.city = ?')
    params.push(city)
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.max(1, Math.min(100, Number(limit)))
  const offset = (pageNum - 1) * limitNum

  const countRow = db.prepare(
    `SELECT COUNT(DISTINCT ar.post_id) as total
     FROM audit_records ar
     JOIN posts p ON ar.post_id = p.id
     ${where}`
  ).get(...params) as { total: number }

  const rows = db.prepare(
    `SELECT ar.*, p.title, p.category, p.province, p.city, p.district, p.risk_score, p.status as post_status
     FROM audit_records ar
     JOIN posts p ON ar.post_id = p.id
     ${where}
     ORDER BY ar.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset)

  res.json({
    success: true,
    data: {
      items: rows,
      total: countRow.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(countRow.total / limitNum),
    },
  })
})

router.post('/:id/action', (req: Request, res: Response): void => {
  const db = getDb()
  const postId = req.params.id
  const { auditor_id, stage, result, comment } = req.body

  if (!auditor_id || !stage || !result) {
    res.status(400).json({ success: false, error: 'Missing required fields: auditor_id, stage, result' })
    return
  }

  const validStages = ['initial', 'review', 'top_recommend']
  const validResults = ['approved', 'rejected', 'flagged']

  if (!validStages.includes(stage)) {
    res.status(400).json({ success: false, error: 'Invalid stage. Must be: initial, review, top_recommend' })
    return
  }
  if (!validResults.includes(result)) {
    res.status(400).json({ success: false, error: 'Invalid result. Must be: approved, rejected, flagged' })
    return
  }

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId)
  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' })
    return
  }

  const auditResult = db.prepare(
    'INSERT INTO audit_records (post_id, auditor_id, stage, result, comment) VALUES (?, ?, ?, ?, ?)'
  ).run(postId, auditor_id, stage, result, comment || null)

  if (result === 'approved') {
    if (stage === 'initial') {
      db.prepare("UPDATE posts SET status = 'approved' WHERE id = ?").run(postId)
    } else if (stage === 'top_recommend') {
      db.prepare('UPDATE posts SET is_top = 1, status = ? WHERE id = ?').run('approved', postId)
    } else {
      db.prepare("UPDATE posts SET status = 'approved' WHERE id = ?").run(postId)
    }
  } else if (result === 'rejected') {
    db.prepare("UPDATE posts SET status = 'rejected' WHERE id = ?").run(postId)
  } else {
    db.prepare("UPDATE posts SET status = 'pending' WHERE id = ?").run(postId)
  }

  const record = db.prepare('SELECT * FROM audit_records WHERE id = ?').get(auditResult.lastInsertRowid)
  res.status(201).json({ success: true, data: record })
})

router.get('/stats', (req: Request, res: Response): void => {
  const db = getDb()

  const totalAudits = (db.prepare('SELECT COUNT(*) as count FROM audit_records').get() as { count: number }).count
  const approvedCount = (db.prepare("SELECT COUNT(*) as count FROM audit_records WHERE result = 'approved'").get() as { count: number }).count
  const rejectedCount = (db.prepare("SELECT COUNT(*) as count FROM audit_records WHERE result = 'rejected'").get() as { count: number }).count
  const flaggedCount = (db.prepare("SELECT COUNT(*) as count FROM audit_records WHERE result = 'flagged'").get() as { count: number }).count

  const passRate = totalAudits > 0 ? Math.round((approvedCount / totalAudits) * 100) : 0

  const byStage = db.prepare(
    `SELECT stage, COUNT(*) as count,
      SUM(CASE WHEN result = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN result = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN result = 'flagged' THEN 1 ELSE 0 END) as flagged
    FROM audit_records
    GROUP BY stage`
  ).all()

  const byAuditor = db.prepare(
    `SELECT ar.auditor_id, u.name as auditor_name,
      COUNT(*) as total,
      SUM(CASE WHEN ar.result = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN ar.result = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN ar.result = 'flagged' THEN 1 ELSE 0 END) as flagged
    FROM audit_records ar
    JOIN users u ON ar.auditor_id = u.id
    GROUP BY ar.auditor_id`
  ).all()

  const pendingByStage = db.prepare(
    `SELECT ar.stage, COUNT(DISTINCT ar.post_id) as count
    FROM audit_records ar
    JOIN posts p ON ar.post_id = p.id
    WHERE p.status = 'pending'
    GROUP BY ar.stage`
  ).all()

  res.json({
    success: true,
    data: {
      total_audits: totalAudits,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
      flagged_count: flaggedCount,
      pass_rate: passRate,
      by_stage: byStage,
      by_auditor: byAuditor,
      pending_by_stage: pendingByStage,
    },
  })
})

export default router
