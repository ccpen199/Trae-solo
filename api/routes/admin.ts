import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/review-queue', (req: Request, res: Response): void => {
  const posts = db.prepare(
    `SELECT p.*, u.name as user_name FROM community_posts p JOIN users u ON p.user_id = u.id WHERE p.review_status IN ('pending', 'flagged') ORDER BY p.risk_level DESC, p.created_at ASC`
  ).all()
  res.json({ success: true, data: posts })
})

router.put('/review/:id', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { result: reviewResult, reason } = req.body
  if (!reviewResult) {
    res.status(400).json({ success: false, error: '审核结果为必填项' })
    return
  }

  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(Number(req.params.id))
  if (!post) {
    res.status(404).json({ success: false, error: '帖子不存在' })
    return
  }

  const statusMap: Record<string, string> = {
    approve: 'approved',
    reject: 'rejected',
    ban: 'banned'
  }
  const newStatus = statusMap[reviewResult] || reviewResult

  db.prepare('UPDATE community_posts SET review_status = ? WHERE id = ?').run(newStatus, Number(req.params.id))
  db.prepare(
    'INSERT INTO content_reviews (post_id, reviewer_id, result, reason) VALUES (?, ?, ?, ?)'
  ).run(Number(req.params.id), Number(userId), newStatus, reason || null)

  res.json({ success: true, data: { id: Number(req.params.id), review_status: newStatus } })
})

router.get('/supervision', (req: Request, res: Response): void => {
  const blockedTrades = db.prepare(
    "SELECT * FROM breedings WHERE status = 'agreed'"
  ).all()

  const nonCompliantProducts = db.prepare(
    'SELECT * FROM products WHERE is_compliant = 0'
  ).all()

  const pendingEscrow = db.prepare(
    "SELECT * FROM escrow_payments WHERE status = 'pending'"
  ).all()

  res.json({
    success: true,
    data: {
      blocked_live_trades: blockedTrades,
      non_compliant_products: nonCompliantProducts,
      pending_escrow: pendingEscrow
    }
  })
})

router.get('/filing', (req: Request, res: Response): void => {
  const { status, filing_type } = req.query
  let sql = 'SELECT * FROM filing_records WHERE 1=1'
  const params: any[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (filing_type) {
    sql += ' AND filing_type = ?'
    params.push(filing_type)
  }
  sql += ' ORDER BY filed_at DESC'

  const records = db.prepare(sql).all(...params)
  res.json({ success: true, data: records })
})

router.post('/filing/sync', (req: Request, res: Response): void => {
  const pendingFilings = db.prepare(
    "SELECT * FROM filing_records WHERE status = 'pending'"
  ).all() as any[]

  for (const filing of pendingFilings) {
    const responseData = JSON.stringify({ code: '200', message: '备案成功', timestamp: new Date().toISOString() })
    db.prepare('UPDATE filing_records SET status = ?, response_data = ? WHERE id = ?').run('completed', responseData, filing.id)
  }

  res.json({ success: true, data: { synced_count: pendingFilings.length } })
})

router.get('/users', (req: Request, res: Response): void => {
  const { role, verify_status } = req.query
  let sql = 'SELECT id, phone, name, real_name, verify_status, role, vet_license, avatar_url, created_at FROM users WHERE 1=1'
  const params: any[] = []

  if (role) {
    sql += ' AND role = ?'
    params.push(role)
  }
  if (verify_status) {
    sql += ' AND verify_status = ?'
    params.push(verify_status)
  }
  sql += ' ORDER BY created_at DESC'

  const users = db.prepare(sql).all(...params)
  res.json({ success: true, data: users })
})

router.put('/users/:id', (req: Request, res: Response): void => {
  const { verify_status, role } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id))
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  db.prepare('UPDATE users SET verify_status = COALESCE(?, verify_status), role = COALESCE(?, role) WHERE id = ?')
    .run(verify_status || null, role || null, Number(req.params.id))

  const updated = db.prepare('SELECT id, phone, name, real_name, verify_status, role, vet_license, avatar_url, created_at FROM users WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: updated })
})

export default router
