import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/projects', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', keyword, type, status, department_id, region } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (keyword) {
      whereClauses.push('(title LIKE ? OR description LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (type) {
      whereClauses.push('type = ?')
      params.push(type)
    }
    if (status) {
      whereClauses.push('status = ?')
      params.push(status)
    }
    if (department_id) {
      whereClauses.push('department_id = ?')
      params.push(department_id)
    }
    if (region) {
      whereClauses.push('region = ?')
      params.push(region)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM bidding_projects ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT bp.*, d.name as department_name,
             (SELECT COUNT(*) FROM bidding_applications ba WHERE ba.bidding_project_id = bp.id) as application_count
      FROM bidding_projects bp 
      LEFT JOIN departments d ON bp.department_id = d.id
      ${whereSql}
      ORDER BY bp.id DESC
      LIMIT ? OFFSET ?
    `)
    const projects = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: projects, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get bidding projects error:', error)
    res.status(500).json({ success: false, error: 'Failed to get bidding projects' })
  }
})

router.get('/projects/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const project = db.prepare(`
      SELECT bp.*, d.name as department_name 
      FROM bidding_projects bp 
      LEFT JOIN departments d ON bp.department_id = d.id
      WHERE bp.id = ?
    `).get(id)

    if (!project) {
      res.status(404).json({ success: false, error: 'Bidding project not found' })
      return
    }

    const applications = db.prepare(`
      SELECT ba.*, e.name as enterprise_name 
      FROM bidding_applications ba 
      LEFT JOIN enterprises e ON ba.enterprise_id = e.id
      WHERE ba.bidding_project_id = ?
      ORDER BY ba.bid_amount ASC
    `).all(id)

    res.json({ success: true, data: { ...(project as object), applications } })
  } catch (error) {
    console.error('Get bidding project detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get bidding project' })
  }
})

router.post('/projects', (req: Request, res: Response): void => {
  try {
    const { title, type, budget, department_id, deadline, status, description, region } = req.body

    if (!title || !type) {
      res.status(400).json({ success: false, error: 'Title and type are required' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO bidding_projects (title, type, budget, department_id, deadline, status, description, region)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      title,
      type,
      budget || 0,
      department_id || null,
      deadline || null,
      status || 'open',
      description || null,
      region || null
    )

    const project = db.prepare('SELECT * FROM bidding_projects WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: project })
  } catch (error) {
    console.error('Create bidding project error:', error)
    res.status(500).json({ success: false, error: 'Failed to create bidding project' })
  }
})

router.put('/projects/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { title, type, budget, department_id, deadline, status, description, region } = req.body

    const existing = db.prepare('SELECT id FROM bidding_projects WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Bidding project not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE bidding_projects 
      SET title = ?, type = ?, budget = ?, department_id = ?, deadline = ?, status = ?, description = ?, region = ?
      WHERE id = ?
    `)
    stmt.run(title, type, budget, department_id, deadline, status, description, region, id)

    const project = db.prepare('SELECT * FROM bidding_projects WHERE id = ?').get(id)
    res.json({ success: true, data: project })
  } catch (error) {
    console.error('Update bidding project error:', error)
    res.status(500).json({ success: false, error: 'Failed to update bidding project' })
  }
})

router.delete('/projects/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM bidding_projects WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Bidding project not found' })
      return
    }

    db.prepare('DELETE FROM bidding_applications WHERE bidding_project_id = ?').run(id)
    db.prepare('DELETE FROM bidding_projects WHERE id = ?').run(id)
    res.json({ success: true, data: { message: 'Bidding project deleted successfully' } })
  } catch (error) {
    console.error('Delete bidding project error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete bidding project' })
  }
})

router.get('/applications', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', enterprise_id, bidding_project_id, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (enterprise_id) {
      whereClauses.push('ba.enterprise_id = ?')
      params.push(enterprise_id)
    }
    if (bidding_project_id) {
      whereClauses.push('ba.bidding_project_id = ?')
      params.push(bidding_project_id)
    }
    if (status) {
      whereClauses.push('ba.status = ?')
      params.push(status)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM bidding_applications ba ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT ba.*, e.name as enterprise_name, bp.title as project_title, bp.budget as project_budget
      FROM bidding_applications ba 
      LEFT JOIN enterprises e ON ba.enterprise_id = e.id
      LEFT JOIN bidding_projects bp ON ba.bidding_project_id = bp.id
      ${whereSql}
      ORDER BY ba.submitted_at DESC
      LIMIT ? OFFSET ?
    `)
    const applications = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: applications, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get bidding applications error:', error)
    res.status(500).json({ success: false, error: 'Failed to get bidding applications' })
  }
})

router.post('/applications', (req: Request, res: Response): void => {
  try {
    const { enterprise_id, bidding_project_id, bid_amount } = req.body

    if (!enterprise_id || !bidding_project_id) {
      res.status(400).json({ success: false, error: 'enterprise_id and bidding_project_id are required' })
      return
    }

    const project = db.prepare('SELECT * FROM bidding_projects WHERE id = ?').get(bidding_project_id) as any
    if (!project) {
      res.status(404).json({ success: false, error: 'Bidding project not found' })
      return
    }

    if (project.status !== 'open') {
      res.status(400).json({ success: false, error: 'Bidding project is not open for applications' })
      return
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(enterprise_id)
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const existingApp = db.prepare(`
      SELECT id FROM bidding_applications 
      WHERE enterprise_id = ? AND bidding_project_id = ?
    `).get(enterprise_id, bidding_project_id)

    if (existingApp) {
      res.status(400).json({ success: false, error: 'Enterprise has already applied for this project' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO bidding_applications (enterprise_id, bidding_project_id, bid_amount)
      VALUES (?, ?, ?)
    `)
    const result = stmt.run(
      enterprise_id,
      bidding_project_id,
      bid_amount || null
    )

    const application = db.prepare(`
      SELECT ba.*, e.name as enterprise_name, bp.title as project_title
      FROM bidding_applications ba
      LEFT JOIN enterprises e ON ba.enterprise_id = e.id
      LEFT JOIN bidding_projects bp ON ba.bidding_project_id = bp.id
      WHERE ba.id = ?
    `).get(result.lastInsertRowid)

    res.json({ success: true, data: application })
  } catch (error) {
    console.error('Submit bidding application error:', error)
    res.status(500).json({ success: false, error: 'Failed to submit bidding application' })
  }
})

router.put('/applications/:id/status', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { status } = req.body

    const existing = db.prepare('SELECT id FROM bidding_applications WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Bidding application not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE bidding_applications 
      SET status = ?
      WHERE id = ?
    `)
    stmt.run(status || 'submitted', id)

    const application = db.prepare('SELECT * FROM bidding_applications WHERE id = ?').get(id)
    res.json({ success: true, data: application })
  } catch (error) {
    console.error('Update bidding application status error:', error)
    res.status(500).json({ success: false, error: 'Failed to update bidding application status' })
  }
})

router.get('/types', (req: Request, res: Response): void => {
  try {
    const types = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM bidding_projects 
      GROUP BY type
    `).all()

    res.json({ success: true, data: types })
  } catch (error) {
    console.error('Get bidding types error:', error)
    res.status(500).json({ success: false, error: 'Failed to get bidding types' })
  }
})

export default router
