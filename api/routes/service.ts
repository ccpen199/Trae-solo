import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/items', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', keyword, category, department_id, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (keyword) {
      whereClauses.push('(name LIKE ? OR description LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (category) {
      whereClauses.push('category = ?')
      params.push(category)
    }
    if (department_id) {
      whereClauses.push('department_id = ?')
      params.push(department_id)
    }
    if (status) {
      whereClauses.push('status = ?')
      params.push(status)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM service_items ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT si.*, d.name as department_name 
      FROM service_items si 
      LEFT JOIN departments d ON si.department_id = d.id
      ${whereSql}
      ORDER BY si.id DESC
      LIMIT ? OFFSET ?
    `)
    const services = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: services, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get service items error:', error)
    res.status(500).json({ success: false, error: 'Failed to get service items' })
  }
})

router.get('/items/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const service = db.prepare(`
      SELECT si.*, d.name as department_name 
      FROM service_items si 
      LEFT JOIN departments d ON si.department_id = d.id 
      WHERE si.id = ?
    `).get(id)

    if (!service) {
      res.status(404).json({ success: false, error: 'Service item not found' })
      return
    }

    res.json({ success: true, data: service })
  } catch (error) {
    console.error('Get service item detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get service item' })
  }
})

router.post('/items', (req: Request, res: Response): void => {
  try {
    const { name, category, department_id, description, processing_days, required_materials, conditions, status } = req.body

    if (!name || !category) {
      res.status(400).json({ success: false, error: 'Name and category are required' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO service_items (name, category, department_id, description, processing_days, required_materials, conditions, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      name,
      category,
      department_id || null,
      description || null,
      processing_days || 15,
      required_materials || null,
      conditions || null,
      status || 'active'
    )

    const service = db.prepare('SELECT * FROM service_items WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: service })
  } catch (error) {
    console.error('Create service item error:', error)
    res.status(500).json({ success: false, error: 'Failed to create service item' })
  }
})

router.put('/items/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, category, department_id, description, processing_days, required_materials, conditions, status } = req.body

    const existing = db.prepare('SELECT id FROM service_items WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service item not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE service_items 
      SET name = ?, category = ?, department_id = ?, description = ?, processing_days = ?, 
          required_materials = ?, conditions = ?, status = ?
      WHERE id = ?
    `)
    stmt.run(name, category, department_id, description, processing_days, required_materials, conditions, status, id)

    const service = db.prepare('SELECT * FROM service_items WHERE id = ?').get(id)
    res.json({ success: true, data: service })
  } catch (error) {
    console.error('Update service item error:', error)
    res.status(500).json({ success: false, error: 'Failed to update service item' })
  }
})

router.delete('/items/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM service_items WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service item not found' })
      return
    }

    db.prepare('DELETE FROM service_items WHERE id = ?').run(id)
    res.json({ success: true, data: { message: 'Service item deleted successfully' } })
  } catch (error) {
    console.error('Delete service item error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete service item' })
  }
})

router.get('/applications', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', enterprise_id, service_item_id, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (enterprise_id) {
      whereClauses.push('sa.enterprise_id = ?')
      params.push(enterprise_id)
    }
    if (service_item_id) {
      whereClauses.push('sa.service_item_id = ?')
      params.push(service_item_id)
    }
    if (status) {
      whereClauses.push('sa.status = ?')
      params.push(status)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM service_applications sa ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT sa.*, e.name as enterprise_name, si.name as service_name 
      FROM service_applications sa 
      LEFT JOIN enterprises e ON sa.enterprise_id = e.id
      LEFT JOIN service_items si ON sa.service_item_id = si.id
      ${whereSql}
      ORDER BY sa.id DESC
      LIMIT ? OFFSET ?
    `)
    const applications = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: applications, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get service applications error:', error)
    res.status(500).json({ success: false, error: 'Failed to get service applications' })
  }
})

router.get('/applications/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const application = db.prepare(`
      SELECT sa.*, e.name as enterprise_name, si.name as service_name, si.description as service_description
      FROM service_applications sa 
      LEFT JOIN enterprises e ON sa.enterprise_id = e.id
      LEFT JOIN service_items si ON sa.service_item_id = si.id
      WHERE sa.id = ?
    `).get(id)

    if (!application) {
      res.status(404).json({ success: false, error: 'Service application not found' })
      return
    }

    res.json({ success: true, data: application })
  } catch (error) {
    console.error('Get service application detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get service application' })
  }
})

router.post('/applications', (req: Request, res: Response): void => {
  try {
    const { enterprise_id, service_item_id, applicant_name, applicant_phone, submitted_materials, remark } = req.body

    if (!enterprise_id || !service_item_id) {
      res.status(400).json({ success: false, error: 'enterprise_id and service_item_id are required' })
      return
    }

    const service = db.prepare('SELECT id FROM service_items WHERE id = ?').get(service_item_id)
    if (!service) {
      res.status(404).json({ success: false, error: 'Service item not found' })
      return
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(enterprise_id)
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO service_applications (enterprise_id, service_item_id, applicant_name, applicant_phone, submitted_materials, remark)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      enterprise_id,
      service_item_id,
      applicant_name || null,
      applicant_phone || null,
      submitted_materials || null,
      remark || null
    )

    const application = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: application })
  } catch (error) {
    console.error('Submit service application error:', error)
    res.status(500).json({ success: false, error: 'Failed to submit service application' })
  }
})

router.put('/applications/:id/process', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { status, result, remark } = req.body

    const existing = db.prepare('SELECT id FROM service_applications WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service application not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE service_applications 
      SET status = ?, result = ?, remark = ?, processed_at = datetime('now', 'localtime')
      WHERE id = ?
    `)
    stmt.run(status || 'processing', result || null, remark || null, id)

    const application = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(id)
    res.json({ success: true, data: application })
  } catch (error) {
    console.error('Process service application error:', error)
    res.status(500).json({ success: false, error: 'Failed to process service application' })
  }
})

router.get('/categories', (req: Request, res: Response): void => {
  try {
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM service_items 
      WHERE status = 'active'
      GROUP BY category
    `).all()

    res.json({ success: true, data: categories })
  } catch (error) {
    console.error('Get service categories error:', error)
    res.status(500).json({ success: false, error: 'Failed to get service categories' })
  }
})

export default router
