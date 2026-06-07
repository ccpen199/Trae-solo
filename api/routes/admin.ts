import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

function buildDashboard() {
  const services = (db.prepare('SELECT COUNT(*) as count FROM service_registry').get() as any).count
  const users = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
  const tickets = (db.prepare('SELECT COUNT(*) as count FROM complaints').get() as any).count
  const knowledge = (db.prepare('SELECT COUNT(*) as count FROM knowledge_entries').get() as any).count
  const applications = (db.prepare('SELECT COUNT(*) as count FROM applications').get() as any).count

  return {
    stats: {
      services,
      users,
      tickets,
      knowledge,
      applications,
    },
    modules: [
      { name: '服务治理', count: services, status: '在线服务可治理' },
      { name: '用户管理', count: users, status: '账号权限可审计' },
      { name: '工单分拨', count: tickets, status: '诉求路由可追踪' },
      { name: '知识库', count: knowledge, status: '语义检索可用' },
      { name: '申办记录', count: applications, status: '全程网办可查询' },
    ],
  }
}

router.get('/stats', (_req: Request, res: Response): void => {
  res.json({ code: 0, message: 'success', data: buildDashboard().stats })
})

router.get('/dashboard', (_req: Request, res: Response): void => {
  res.json({ code: 0, message: 'success', data: buildDashboard() })
})

router.use(authMiddleware, adminMiddleware)

router.get('/services', (_req: Request, res: Response): void => {
  try {
    const services = db.prepare('SELECT * FROM service_registry').all()
    res.json({ code: 0, message: 'success', data: services })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/services', (req: Request, res: Response): void => {
  try {
    const { name, department, endpoint, rate_limit_qps, circuit_threshold } = req.body
    if (!name || !department) {
      res.json({ code: -1, message: '请提供服务名称和部门' })
      return
    }
    const result = db.prepare('INSERT INTO service_registry (name, department, endpoint, rate_limit_qps, circuit_threshold) VALUES (?, ?, ?, ?, ?)').run(
      name, department, endpoint || '', rate_limit_qps || 100, circuit_threshold || 0.5,
    )
    res.json({ code: 0, message: 'success', data: { id: Number(result.lastInsertRowid) } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.put('/services/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const service = db.prepare('SELECT * FROM service_registry WHERE id = ?').get(id) as any
    if (!service) {
      res.json({ code: -1, message: '服务不存在' })
      return
    }

    const allowedFields = [
      'name',
      'department',
      'endpoint',
      'rate_limit_qps',
      'circuit_threshold',
      'status',
    ]
    const updates: string[] = []
    const values: any[] = []

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(req.body[field])
      }
    }

    if (updates.length === 0) {
      res.json({ code: -1, message: '请提供更新内容' })
      return
    }

    values.push(id)
    db.prepare(`UPDATE service_registry SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    const updated = db.prepare('SELECT * FROM service_registry WHERE id = ?').get(id)
    res.json({ code: 0, message: 'success', data: updated })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.delete('/services/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const service = db.prepare('SELECT id FROM service_registry WHERE id = ?').get(id)
    if (!service) {
      res.json({ code: -1, message: '服务不存在' })
      return
    }

    db.prepare('DELETE FROM service_metrics WHERE service_id = ?').run(id)
    db.prepare('DELETE FROM service_registry WHERE id = ?').run(id)
    res.json({ code: 0, message: 'success' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.put('/services/:id/rate-limit', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { rate_limit_qps } = req.body
    if (rate_limit_qps === undefined) {
      res.json({ code: -1, message: '请提供rate_limit_qps' })
      return
    }
    db.prepare('UPDATE service_registry SET rate_limit_qps = ? WHERE id = ?').run(rate_limit_qps, id)
    res.json({ code: 0, message: 'success' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.put('/services/:id/circuit', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { circuit_threshold } = req.body
    if (circuit_threshold === undefined) {
      res.json({ code: -1, message: '请提供circuit_threshold' })
      return
    }
    db.prepare('UPDATE service_registry SET circuit_threshold = ? WHERE id = ?').run(circuit_threshold, id)
    res.json({ code: 0, message: 'success' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/monitor', (_req: Request, res: Response): void => {
  try {
    const services = db.prepare('SELECT * FROM service_registry').all() as any[]
    const metrics = db.prepare(`
      SELECT service_id, metric_type, AVG(value) as avg_value, COUNT(*) as count
      FROM service_metrics
      GROUP BY service_id, metric_type
    `).all()
    const result = services.map(s => {
      const serviceMetrics = (metrics as any[]).filter(m => m.service_id === s.id)
      return { ...s, metrics: serviceMetrics }
    })
    res.json({ code: 0, message: 'success', data: result })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/tickets', (_req: Request, res: Response): void => {
  try {
    const tickets = db.prepare('SELECT c.*, u.name as user_name, u.phone as user_phone FROM complaints c JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC').all()
    res.json({ code: 0, message: 'success', data: tickets })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.put('/tickets/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { status, assigned_to, reply } = req.body
    const ticket = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as any
    if (!ticket) {
      res.json({ code: -1, message: '工单不存在' })
      return
    }
    const updates: string[] = []
    const values: any[] = []
    if (status !== undefined) { updates.push('status = ?'); values.push(status) }
    if (assigned_to !== undefined) { updates.push('assigned_to = ?'); values.push(assigned_to) }
    if (reply !== undefined) { updates.push('reply = ?'); values.push(reply) }
    if (updates.length === 0) {
      res.json({ code: -1, message: '请提供更新内容' })
      return
    }
    updates.push("updated_at = datetime('now')")
    values.push(id)
    db.prepare(`UPDATE complaints SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    res.json({ code: 0, message: 'success' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/tickets/routes', (_req: Request, res: Response): void => {
  try {
    const rules = db.prepare('SELECT * FROM ticket_route_rules ORDER BY priority DESC').all()
    res.json({ code: 0, message: 'success', data: rules })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/tickets/routes', (req: Request, res: Response): void => {
  try {
    const { street, department, complaint_type, priority } = req.body
    if (!street || !department || !complaint_type) {
      res.json({ code: -1, message: '请提供街道、部门和投诉类型' })
      return
    }
    const result = db.prepare('INSERT INTO ticket_route_rules (street, department, complaint_type, priority) VALUES (?, ?, ?, ?)').run(street, department, complaint_type, priority || 0)
    res.json({ code: 0, message: 'success', data: { id: Number(result.lastInsertRowid) } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/knowledge', (_req: Request, res: Response): void => {
  try {
    const entries = db.prepare('SELECT * FROM knowledge_entries ORDER BY created_at DESC').all()
    res.json({ code: 0, message: 'success', data: entries })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/knowledge', (req: Request, res: Response): void => {
  try {
    const { title, content, category, keywords } = req.body
    if (!title || !content) {
      res.json({ code: -1, message: '请提供标题和内容' })
      return
    }
    const result = db.prepare('INSERT INTO knowledge_entries (title, content, category, keywords) VALUES (?, ?, ?, ?)').run(
      title, content, category || '通用', JSON.stringify(keywords || []),
    )
    res.json({ code: 0, message: 'success', data: { id: Number(result.lastInsertRowid) } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/knowledge/search', (req: Request, res: Response): void => {
  try {
    const { query } = req.body
    if (!query) {
      res.json({ code: -1, message: '请提供搜索关键词' })
      return
    }
    const keywords = query.split(/\s+/).filter(Boolean)
    const entries = db.prepare('SELECT * FROM knowledge_entries').all() as any[]
    const results = entries.filter(entry => {
      const searchStr = `${entry.title} ${entry.content} ${entry.keywords}`.toLowerCase()
      return keywords.some(kw => searchStr.includes(kw.toLowerCase()))
    })
    res.json({ code: 0, message: 'success', data: results })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.put('/knowledge/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { title, content, category, keywords } = req.body
    const entry = db.prepare('SELECT * FROM knowledge_entries WHERE id = ?').get(id) as any
    if (!entry) {
      res.json({ code: -1, message: '知识条目不存在' })
      return
    }
    db.prepare('UPDATE knowledge_entries SET title = ?, content = ?, category = ?, keywords = ? WHERE id = ?').run(
      title || entry.title,
      content || entry.content,
      category || entry.category,
      keywords ? JSON.stringify(keywords) : entry.keywords,
      id,
    )
    res.json({ code: 0, message: 'success' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.delete('/knowledge/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    db.prepare('DELETE FROM knowledge_entries WHERE id = ?').run(id)
    res.json({ code: 0, message: 'success' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/users', (_req: Request, res: Response): void => {
  try {
    const users = db.prepare('SELECT id, phone, name, role, verified, sukang_status, street, created_at FROM users').all()
    res.json({ code: 0, message: 'success', data: users })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
