import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

function buildTree(orgs: any[], parentId: number | null): any[] {
  return orgs
    .filter(o => o.parent_id === parentId)
    .map(o => {
      const children = buildTree(orgs, o.id)
      const memberCount = (db.prepare('SELECT COUNT(*) as c FROM users WHERE organization_id = ?').get(o.id) as any).c
      return { ...o, memberCount, children }
    })
}

router.get('/tree', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const orgs = db.prepare('SELECT * FROM organizations ORDER BY id').all() as any[]
    const tree = buildTree(orgs, null)
    res.json({ success: true, data: tree })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/members', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { organization_id, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)

    if (!organization_id) {
      res.status(400).json({ success: false, error: '组织ID不能为空' })
      return
    }

    const total = (db.prepare('SELECT COUNT(*) as c FROM users WHERE organization_id = ?').get(organization_id) as any).c
    const rows = db.prepare(
      `SELECT u.id, u.phone, u.name, u.status, u.avatar, u.created_at, r.name as role_name, r.display_name as role_display_name
       FROM users u LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.organization_id = ? ORDER BY u.id LIMIT ? OFFSET ?`
    ).all(organization_id, ps, (p - 1) * ps)

    res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/members', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, name, role_id, organization_id } = req.body
    if (!phone || !password || !name || !role_id || !organization_id) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone) as any
    if (existing) {
      res.status(400).json({ success: false, error: '手机号已存在' })
      return
    }

    const bcrypt = await import('bcryptjs')
    const hashedPw = bcrypt.default.hashSync(password, 10)
    const result = db.prepare(
      'INSERT INTO users (phone, password, name, role_id, organization_id) VALUES (?,?,?,?,?)'
    ).run(phone, hashedPw, name, role_id, organization_id)

    const user = db.prepare('SELECT id, phone, name, role_id, organization_id, status FROM users WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: user })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/members/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, role_id, organization_id, status } = req.body
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    db.prepare(
      `UPDATE users SET name = COALESCE(?,name), phone = COALESCE(?,phone),
       role_id = COALESCE(?,role_id), organization_id = COALESCE(?,organization_id),
       status = COALESCE(?,status), updated_at = datetime('now','localtime') WHERE id = ?`
    ).run(name || null, phone || null, role_id || null, organization_id || null, status || null, req.params.id)

    const updated = db.prepare('SELECT id, phone, name, role_id, organization_id, status FROM users WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/members/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
