import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', enterprise_id, type, status, department_id, priority } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (enterprise_id) {
      whereClauses.push('a.enterprise_id = ?')
      params.push(enterprise_id)
    }
    if (type) {
      whereClauses.push('a.type = ?')
      params.push(type)
    }
    if (status) {
      whereClauses.push('a.status = ?')
      params.push(status)
    }
    if (department_id) {
      whereClauses.push('a.department_id = ?')
      params.push(department_id)
    }
    if (priority) {
      whereClauses.push('a.priority = ?')
      params.push(priority)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM appeals a ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT a.*, e.name as enterprise_name, d.name as department_name 
      FROM appeals a 
      LEFT JOIN enterprises e ON a.enterprise_id = e.id
      LEFT JOIN departments d ON a.department_id = d.id
      ${whereSql}
      ORDER BY 
        CASE a.priority 
          WHEN 'high' THEN 1 
          WHEN 'normal' THEN 2 
          WHEN 'low' THEN 3 
        END ASC,
        a.id DESC
      LIMIT ? OFFSET ?
    `)
    const appeals = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: appeals, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get appeals error:', error)
    res.status(500).json({ success: false, error: 'Failed to get appeals' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const appeal = db.prepare(`
      SELECT a.*, e.name as enterprise_name, d.name as department_name 
      FROM appeals a 
      LEFT JOIN enterprises e ON a.enterprise_id = e.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE a.id = ?
    `).get(id)

    if (!appeal) {
      res.status(404).json({ success: false, error: 'Appeal not found' })
      return
    }

    res.json({ success: true, data: appeal })
  } catch (error) {
    console.error('Get appeal detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get appeal' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { enterprise_id, type, title, content, priority, deadline } = req.body

    if (!enterprise_id || !type || !title || !content) {
      res.status(400).json({ success: false, error: 'enterprise_id, type, title, and content are required' })
      return
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(enterprise_id)
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO appeals (enterprise_id, type, title, content, priority, deadline)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      enterprise_id,
      type,
      title,
      content,
      priority || 'normal',
      deadline || null
    )

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: appeal })
  } catch (error) {
    console.error('Create appeal error:', error)
    res.status(500).json({ success: false, error: 'Failed to create appeal' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { type, title, content, priority, deadline, status } = req.body

    const existing = db.prepare('SELECT id FROM appeals WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Appeal not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE appeals 
      SET type = ?, title = ?, content = ?, priority = ?, deadline = ?, status = ?, 
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `)
    stmt.run(type, title, content, priority, deadline, status || 'pending', id)

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id)
    res.json({ success: true, data: appeal })
  } catch (error) {
    console.error('Update appeal error:', error)
    res.status(500).json({ success: false, error: 'Failed to update appeal' })
  }
})

router.put('/:id/dispatch', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { department_id } = req.body

    if (!department_id) {
      res.status(400).json({ success: false, error: 'department_id is required' })
      return
    }

    const existing = db.prepare('SELECT id FROM appeals WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Appeal not found' })
      return
    }

    const department = db.prepare('SELECT id FROM departments WHERE id = ?').get(department_id)
    if (!department) {
      res.status(404).json({ success: false, error: 'Department not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE appeals 
      SET department_id = ?, status = 'processing', updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `)
    stmt.run(department_id, id)

    const appeal = db.prepare(`
      SELECT a.*, d.name as department_name 
      FROM appeals a 
      LEFT JOIN departments d ON a.department_id = d.id 
      WHERE a.id = ?
    `).get(id)

    res.json({ success: true, data: appeal })
  } catch (error) {
    console.error('Dispatch appeal error:', error)
    res.status(500).json({ success: false, error: 'Failed to dispatch appeal' })
  }
})

router.put('/:id/respond', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { response, responder, status } = req.body

    if (!response || !responder) {
      res.status(400).json({ success: false, error: 'response and responder are required' })
      return
    }

    const existing = db.prepare('SELECT id FROM appeals WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Appeal not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE appeals 
      SET response = ?, responder = ?, status = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `)
    stmt.run(response, responder, status || 'resolved', id)

    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id)
    res.json({ success: true, data: appeal })
  } catch (error) {
    console.error('Respond to appeal error:', error)
    res.status(500).json({ success: false, error: 'Failed to respond to appeal' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM appeals WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Appeal not found' })
      return
    }

    db.prepare('DELETE FROM appeals WHERE id = ?').run(id)
    res.json({ success: true, data: { message: 'Appeal deleted successfully' } })
  } catch (error) {
    console.error('Delete appeal error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete appeal' })
  }
})

router.get('/statistics/summary', (req: Request, res: Response): void => {
  try {
    const stats = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM appeals
      GROUP BY status
    `).all()

    const typeStats = db.prepare(`
      SELECT 
        type,
        COUNT(*) as count
      FROM appeals
      GROUP BY type
    `).all()

    const priorityStats = db.prepare(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM appeals
      GROUP BY priority
    `).all()

    res.json({
      success: true,
      data: {
        byStatus: stats,
        byType: typeStats,
        byPriority: priorityStats
      }
    })
  } catch (error) {
    console.error('Get appeal statistics error:', error)
    res.status(500).json({ success: false, error: 'Failed to get appeal statistics' })
  }
})

export default router
