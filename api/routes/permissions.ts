import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/roles', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = db.prepare('SELECT * FROM roles ORDER BY id').all()
    res.json({ success: true, data: roles })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/roles', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, display_name, permissions } = req.body
    if (!name || !display_name) {
      res.status(400).json({ success: false, error: '角色名称不能为空' })
      return
    }

    const existing = db.prepare('SELECT id FROM roles WHERE name = ?').get(name) as any
    if (existing) {
      res.status(400).json({ success: false, error: '角色已存在' })
      return
    }

    const result = db.prepare(
      'INSERT INTO roles (name, display_name, permissions) VALUES (?,?,?)'
    ).run(name, display_name, permissions ? JSON.stringify(permissions) : '{}')

    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: role })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/roles/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { display_name, permissions } = req.body
    const role = db.prepare('SELECT id FROM roles WHERE id = ?').get(req.params.id) as any
    if (!role) {
      res.status(404).json({ success: false, error: '角色不存在' })
      return
    }

    db.prepare(
      'UPDATE roles SET display_name = COALESCE(?,display_name), permissions = COALESCE(?,permissions) WHERE id = ?'
    ).run(display_name || null, permissions ? JSON.stringify(permissions) : null, req.params.id)

    const updated = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/matrix', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = db.prepare('SELECT * FROM roles ORDER BY id').all() as any[]
    const modules = ['organizations', 'users', 'devices', 'access_records', 'repair_orders', 'community_posts', 'payments', 'announcements', 'reports', 'alerts']

    const matrix = roles.map(role => {
      const perms = JSON.parse(role.permissions || '{}')
      const modulePerms = modules.map(m => ({
        module: m,
        permissions: perms[m] === true ? ['read', 'create', 'update', 'delete'] : Array.isArray(perms[m]) ? perms[m] : [],
      }))
      return {
        role_id: role.id,
        role_name: role.name,
        display_name: role.display_name,
        modules: modulePerms,
      }
    })

    res.json({ success: true, data: { roles: roles.map(r => ({ id: r.id, name: r.name, display_name: r.display_name })), modules, matrix } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
