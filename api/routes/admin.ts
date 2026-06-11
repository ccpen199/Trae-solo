import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

const permissionsConfig: Record<string, string[]> = {
  admin: ['jobs:manage', 'talents:view', 'interviews:manage', 'attendance:manage', 'settlement:manage', 'micro_tasks:manage', 'credit:view', 'risk:manage', 'admin:full'],
  hr: ['jobs:manage', 'talents:view', 'interviews:manage', 'attendance:view', 'settlement:view', 'micro_tasks:manage', 'credit:view', 'risk:view'],
  branch_admin: ['jobs:view', 'talents:view', 'interviews:view', 'attendance:manage', 'settlement:view', 'micro_tasks:view', 'credit:view', 'risk:view'],
  mentor: ['talents:view', 'interviews:manage', 'attendance:view', 'credit:evaluate'],
  student: ['jobs:view', 'micro_tasks:submit', 'attendance:checkin', 'credit:view']
}

router.get('/tenants', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const orgs = db.prepare('SELECT * FROM organizations ORDER BY created_at DESC').all()

    res.json({ success: true, data: orgs })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取租户列表失败' })
  }
})

router.post('/tenants', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, parent_id, contact } = req.body

    if (!name || !type) {
      res.status(400).json({ success: false, error: '名称和类型不能为空' })
      return
    }

    const db = getDb()
    const result = db.prepare(
      `INSERT INTO organizations (name, type, parent_id, contact) VALUES (?, ?, ?, ?)`
    ).run(name, type, parent_id || null, contact || '')

    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(result.lastInsertRowid)

    db.prepare('INSERT INTO fund_pools (org_id, balance, frozen, pending) VALUES (?, 0, 0, 0)').run(result.lastInsertRowid)

    res.status(201).json({ success: true, data: org })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建租户失败' })
  }
})

router.put('/tenants/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, parent_id, contact } = req.body
    const db = getDb()

    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id) as any
    if (!org) {
      res.status(404).json({ success: false, error: '租户不存在' })
      return
    }

    db.prepare(
      `UPDATE organizations SET name = ?, type = ?, parent_id = ?, contact = ? WHERE id = ?`
    ).run(name || org.name, type || org.type, parent_id !== undefined ? parent_id : org.parent_id, contact !== undefined ? contact : org.contact, req.params.id)

    const updated = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新租户失败' })
  }
})

router.get('/permissions', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, data: permissionsConfig })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取权限配置失败' })
  }
})

router.put('/permissions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, permissions } = req.body

    if (!role || !permissions || !Array.isArray(permissions)) {
      res.status(400).json({ success: false, error: '角色和权限列表不能为空' })
      return
    }

    if (permissionsConfig[role]) {
      permissionsConfig[role] = permissions
    }

    res.json({ success: true, data: permissionsConfig })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新权限配置失败' })
  }
})

router.get('/compliance', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    const totalJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'published'").get() as { count: number }
    const unsignedContracts = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE type = 'unsigned_contract' AND status = 'pending'").get() as { count: number }
    const overtimeAlerts = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE type = 'overtime' AND status = 'pending'").get() as { count: number }
    const pendingSettlements = db.prepare("SELECT COUNT(*) as count FROM settlements WHERE status = 'pending'").get() as { count: number }
    const totalSettled = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM settlements WHERE status = 'completed'").get() as { total: number }

    const recentAlerts = db.prepare(`
      SELECT ra.*, o.name as org_name, u.name as related_user_name
      FROM risk_alerts ra
      LEFT JOIN organizations o ON ra.org_id = o.id
      LEFT JOIN users u ON ra.related_user_id = u.id
      WHERE ra.status = 'pending'
      ORDER BY ra.created_at DESC
      LIMIT 10
    `).all()

    res.json({
      success: true,
      data: {
        summary: {
          total_users: totalUsers.count,
          active_jobs: totalJobs.count,
          unsigned_contracts: unsignedContracts.count,
          overtime_alerts: overtimeAlerts.count,
          pending_settlements: pendingSettlements.count,
          total_settled_amount: totalSettled.total
        },
        recent_alerts: recentAlerts
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取合规数据失败' })
  }
})

export default router
