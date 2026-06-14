import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'
import { rbacMiddleware } from '../middleware/rbac.js'
import bcrypt from 'bcryptjs'

const router = Router()

function buildOrgTree(parentId: number | null): any[] {
  const orgs = db.prepare('SELECT * FROM organizations WHERE parent_id IS ? ORDER BY id').all(parentId ?? null) as any[]
  return orgs.map((org) => ({
    id: org.id,
    name: org.name,
    type: org.type,
    parentId: org.parent_id,
    createdAt: org.created_at,
    children: buildOrgTree(org.id),
  }))
}

router.get('/tree', authMiddleware, (req: Request, res: Response): void => {
  try {
    const tree = buildOrgTree(null)
    res.json({ success: true, data: tree })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/', authMiddleware, rbacMiddleware(['group_admin', 'branch_admin']), (req: Request, res: Response): void => {
  try {
    const { name, parentId, type } = req.body
    const result = db.prepare('INSERT INTO organizations (name, parent_id, type) VALUES (?, ?, ?)').run(name, parentId || null, type)
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: org })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.put('/:id', authMiddleware, rbacMiddleware(['group_admin', 'branch_admin']), (req: Request, res: Response): void => {
  try {
    const { name } = req.body
    const existing = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: '组织不存在' })
      return
    }
    db.prepare('UPDATE organizations SET name=? WHERE id=?').run(name, req.params.id)
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: org })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.delete('/:id', authMiddleware, rbacMiddleware(['group_admin']), (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: '组织不存在' })
      return
    }
    const children = db.prepare('SELECT COUNT(*) as count FROM organizations WHERE parent_id = ?').get(req.params.id) as any
    if (children.count > 0) {
      res.status(400).json({ success: false, error: '该组织下存在子组织，无法删除' })
      return
    }
    db.prepare('DELETE FROM organizations WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/:id/users', authMiddleware, (req: Request, res: Response): void => {
  try {
    const users = db.prepare(
      'SELECT id, username, role, org_id, created_at FROM users WHERE org_id = ? ORDER BY id',
    ).all(req.params.id)
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/:id/users', authMiddleware, rbacMiddleware(['group_admin', 'branch_admin']), (req: Request, res: Response): void => {
  try {
    const { username, password, role } = req.body
    const orgId = Number(req.params.id)
    const passwordHash = bcrypt.hashSync(password, 10)
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, role, org_id) VALUES (?, ?, ?, ?)',
    ).run(username, passwordHash, role, orgId)
    const user = db.prepare('SELECT id, username, role, org_id, created_at FROM users WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: user })
  } catch (error: any) {
    if (error.message?.includes('UNIQUE')) {
      res.status(400).json({ success: false, error: '用户名已存在' })
      return
    }
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
