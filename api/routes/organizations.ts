import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { auditLog } from '../middleware/audit.js'

const router = Router()

interface OrgNode {
  id: number
  name: string
  type: string
  parent_id: number | null
  director_id: number | null
  created_at: string
  children?: OrgNode[]
}

function buildTree(orgs: OrgNode[], parentId: number | null = null): OrgNode[] {
  return orgs
    .filter(org => org.parent_id === parentId)
    .map(org => ({
      ...org,
      children: buildTree(orgs, org.id),
    }))
}

router.get('/tree', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const orgs = db.prepare(
      'SELECT * FROM organizations ORDER BY type, name'
    ).all() as OrgNode[]

    const tree = buildTree(orgs)

    res.json({ success: true, data: tree })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', authenticate, requireRole('director', 'admin'), auditLog('create', 'organization'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, parentId, directorId } = req.body

    if (!name || !type) {
      res.status(400).json({ success: false, error: '名称和类型为必填项' })
      return
    }

    if (!['company', 'store', 'team'].includes(type)) {
      res.status(400).json({ success: false, error: '类型必须为 company、store 或 team' })
      return
    }

    if (parentId) {
      const parent = db.prepare('SELECT id FROM organizations WHERE id = ?').get(Number(parentId))
      if (!parent) {
        res.status(404).json({ success: false, error: '父级组织不存在' })
        return
      }
    }

    if (directorId) {
      const director = db.prepare('SELECT id, role FROM users WHERE id = ?').get(Number(directorId)) as any
      if (!director) {
        res.status(404).json({ success: false, error: '负责人不存在' })
        return
      }
      if (director.role !== 'director') {
        res.status(400).json({ success: false, error: '负责人必须是总监角色' })
        return
      }
    }

    const result = db.prepare(
      'INSERT INTO organizations (name, type, parent_id, director_id) VALUES (?, ?, ?, ?)'
    ).run(name, type, parentId ? Number(parentId) : null, directorId ? Number(directorId) : null)

    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(result.lastInsertRowid) as any
    res.status(201).json({ success: true, data: org })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/members', authenticate, requireRole('director', 'manager', 'admin'), auditLog('update_member_org', 'organization'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, orgId } = req.body

    if (!userId) {
      res.status(400).json({ success: false, error: '用户ID为必填项' })
      return
    }

    const user = db.prepare('SELECT id, org_id FROM users WHERE id = ?').get(Number(userId)) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    if (orgId !== null && orgId !== undefined) {
      const org = db.prepare('SELECT id FROM organizations WHERE id = ?').get(Number(orgId)) as any
      if (!org) {
        res.status(404).json({ success: false, error: '组织不存在' })
        return
      }
    }

    if (req.user!.role === 'manager' && user.org_id !== req.user!.org_id) {
      res.status(403).json({ success: false, error: '经理只能调整本组织成员' })
      return
    }

    db.prepare('UPDATE users SET org_id = ? WHERE id = ?').run(
      orgId === null || orgId === undefined ? null : Number(orgId),
      Number(userId)
    )

    const updated = db.prepare(
      'SELECT id, username, name, phone, role, org_id, cert_status FROM users WHERE id = ?'
    ).get(Number(userId)) as any

    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', authenticate, requireRole('director', 'admin'), auditLog('update', 'organization'), async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = Number(req.params.id)
    const { name, type, parentId, directorId } = req.body

    const org = db.prepare('SELECT id FROM organizations WHERE id = ?').get(orgId) as any
    if (!org) {
      res.status(404).json({ success: false, error: '组织不存在' })
      return
    }

    const fields: string[] = []
    const params: any[] = []

    if (name !== undefined) {
      fields.push('name = ?')
      params.push(name)
    }

    if (type !== undefined) {
      if (!['company', 'store', 'team'].includes(type)) {
        res.status(400).json({ success: false, error: '类型必须为 company、store 或 team' })
        return
      }
      fields.push('type = ?')
      params.push(type)
    }

    if (parentId !== undefined) {
      if (parentId !== null) {
        const parent = db.prepare('SELECT id FROM organizations WHERE id = ?').get(Number(parentId))
        if (!parent) {
          res.status(404).json({ success: false, error: '父级组织不存在' })
          return
        }
      }
      fields.push('parent_id = ?')
      params.push(parentId ? Number(parentId) : null)
    }

    if (directorId !== undefined) {
      if (directorId !== null) {
        const director = db.prepare('SELECT id, role FROM users WHERE id = ?').get(Number(directorId)) as any
        if (!director) {
          res.status(404).json({ success: false, error: '负责人不存在' })
          return
        }
        if (director.role !== 'director') {
          res.status(400).json({ success: false, error: '负责人必须是总监角色' })
          return
        }
      }
      fields.push('director_id = ?')
      params.push(directorId ? Number(directorId) : null)
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }

    params.push(orgId)
    db.prepare(`UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`).run(...params)

    const updated = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId) as any
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', authenticate, requireRole('director', 'admin'), auditLog('delete', 'organization'), async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = Number(req.params.id)

    const org = db.prepare('SELECT id FROM organizations WHERE id = ?').get(orgId) as any
    if (!org) {
      res.status(404).json({ success: false, error: '组织不存在' })
      return
    }

    const childCount = db.prepare('SELECT COUNT(*) as count FROM organizations WHERE parent_id = ?').get(orgId) as { count: number }
    if (childCount.count > 0) {
      res.status(400).json({ success: false, error: '该组织下还有子组织，无法删除' })
      return
    }

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE org_id = ?').get(orgId) as { count: number }
    if (userCount.count > 0) {
      res.status(400).json({ success: false, error: '该组织下还有成员，无法删除' })
      return
    }

    db.prepare('DELETE FROM organizations WHERE id = ?').run(orgId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/members', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, orgId, page = '1', pageSize = '10' } = req.query as any

    const conditions: string[] = []
    const params: any[] = []

    if (role) {
      conditions.push('u.role = ?')
      params.push(role)
    }

    if (orgId) {
      conditions.push('u.org_id = ?')
      params.push(Number(orgId))
    }

    if (req.user!.role === 'agent') {
      conditions.push('u.id = ?')
      params.push(req.user!.id)
    } else if (req.user!.role === 'manager') {
      conditions.push('u.org_id = ?')
      params.push(req.user!.org_id)
    }

    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Math.min(100, Number(pageSize)))
    const offset = (pageNum - 1) * pageSizeNum
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM users u ${where}`).get(...params) as { count: number }
    const rows = db.prepare(
      `SELECT u.id, u.username, u.name, u.phone, u.role, u.org_id, u.cert_status, u.real_name, u.avatar,
              o.name as org_name
       FROM users u LEFT JOIN organizations o ON u.org_id = o.id
       ${where}
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSizeNum, offset) as any[]

    res.json({ success: true, data: rows, total: totalRow.count, page: pageNum, pageSize: pageSizeNum })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/members', authenticate, requireRole('director', 'manager'), auditLog('add_member', 'organization'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, orgId } = req.body

    if (!userId || !orgId) {
      res.status(400).json({ success: false, error: '用户ID和组织ID为必填项' })
      return
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(Number(userId)) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const org = db.prepare('SELECT id FROM organizations WHERE id = ?').get(Number(orgId)) as any
    if (!org) {
      res.status(404).json({ success: false, error: '组织不存在' })
      return
    }

    if (req.user!.role === 'manager' && Number(orgId) !== req.user!.org_id) {
      res.status(403).json({ success: false, error: '经理只能添加成员到自己的组织' })
      return
    }

    db.prepare('UPDATE users SET org_id = ? WHERE id = ?').run(Number(orgId), Number(userId))

    const updated = db.prepare(
      'SELECT id, username, name, phone, role, org_id, cert_status FROM users WHERE id = ?'
    ).get(Number(userId)) as any

    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/members/:id/role', authenticate, requireRole('director', 'admin'), auditLog('change_role', 'organization'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.id)
    const { role } = req.body

    if (!role || !['director', 'manager', 'agent'].includes(role)) {
      res.status(400).json({ success: false, error: '角色必须为 director、manager 或 agent' })
      return
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId)

    const updated = db.prepare(
      'SELECT id, username, name, phone, role, org_id, cert_status FROM users WHERE id = ?'
    ).get(userId) as any

    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
