import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, search } = req.query

  let sql = `SELECT u.id, u.name, u.phone, u.avatar, tp.status as tech_status, tp.rating,
    tp.completed_orders, tp.skills
    FROM users u JOIN technician_profiles tp ON u.id = tp.user_id WHERE 1=1`
  const params: any[] = []

  if (status) {
    sql += ` AND tp.status = ?`
    params.push(status)
  }
  if (search) {
    sql += ` AND (u.name LIKE ? OR u.phone LIKE ?)`
    params.push(`%${search}%`, `%${search}%`)
  }

  sql += ` ORDER BY tp.rating DESC`

  const technicians = (db.prepare(sql).all(...params) as any[]).map((t) => ({
    id: t.id,
    name: t.name,
    phone: t.phone,
    avatar: t.avatar,
    status: t.tech_status,
    skills: JSON.parse(t.skills || '[]'),
    rating: t.rating,
    completedOrders: t.completed_orders,
    certificates: t.tech_status === 'approved'
      ? [{ type: '技能认证', url: 'https://storage.example.com/certs/skill.pdf', verified: true }]
      : [],
  }))

  res.json({
    success: true,
    data: { technicians, total: technicians.length },
  })
})

router.put('/:id/audit', (req: Request, res: Response): void => {
  const { action, reason } = req.body
  const techId = req.params.id

  if (!action || !['approve', 'reject'].includes(action)) {
    res.status(400).json({ success: false, error: '操作只能是 approve 或 reject' })
    return
  }

  const profile = db.prepare('SELECT * FROM technician_profiles WHERE user_id = ?').get(techId) as any
  if (!profile) {
    res.status(404).json({ success: false, error: '技师不存在' })
    return
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected'
  db.prepare('UPDATE technician_profiles SET status = ? WHERE user_id = ?').run(newStatus, techId)

  res.json({
    success: true,
    data: {
      id: techId,
      status: newStatus,
      reason: reason || (action === 'approve' ? '审核通过' : '审核未通过'),
    },
  })
})

export default router
