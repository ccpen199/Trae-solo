import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', enterprise_id, category, department, share_scope, verified } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (enterprise_id) {
      whereClauses.push('m.enterprise_id = ?')
      params.push(enterprise_id)
    }
    if (category) {
      whereClauses.push('m.category = ?')
      params.push(category)
    }
    if (department) {
      whereClauses.push('m.department = ?')
      params.push(department)
    }
    if (share_scope) {
      whereClauses.push('m.share_scope LIKE ?')
      params.push(`%${share_scope}%`)
    }
    if (verified !== undefined) {
      whereClauses.push('m.verified = ?')
      params.push(verified === 'true' || verified === '1' ? 1 : 0)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM materials m ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT m.*, e.name as enterprise_name
      FROM materials m 
      LEFT JOIN enterprises e ON m.enterprise_id = e.id
      ${whereSql}
      ORDER BY m.id DESC
      LIMIT ? OFFSET ?
    `)
    const materials = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: materials, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get materials error:', error)
    res.status(500).json({ success: false, error: 'Failed to get materials' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const material = db.prepare(`
      SELECT m.*, e.name as enterprise_name
      FROM materials m 
      LEFT JOIN enterprises e ON m.enterprise_id = e.id
      WHERE m.id = ?
    `).get(id)

    if (!material) {
      res.status(404).json({ success: false, error: 'Material not found' })
      return
    }

    const reuseLogs = db.prepare(`
      SELECT mrl.*, sa.id as application_id, sa.status as application_status
      FROM material_reuse_log mrl
      LEFT JOIN service_applications sa ON mrl.service_application_id = sa.id
      WHERE mrl.material_id = ?
      ORDER BY mrl.used_at DESC
    `).all(id)

    res.json({ success: true, data: { ...(material as object), reuse_logs: reuseLogs } })
  } catch (error) {
    console.error('Get material detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get material' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { enterprise_id, name, category, file_path, department, share_scope, verified, upload_date } = req.body

    if (!enterprise_id || !name || !category) {
      res.status(400).json({ success: false, error: 'enterprise_id, name, and category are required' })
      return
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(enterprise_id)
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO materials (enterprise_id, name, category, file_path, department, share_scope, verified, upload_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      enterprise_id,
      name,
      category,
      file_path || null,
      department || null,
      share_scope || null,
      verified || 0,
      upload_date || null
    )

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: material })
  } catch (error) {
    console.error('Create material error:', error)
    res.status(500).json({ success: false, error: 'Failed to create material' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, category, file_path, department, share_scope, verified } = req.body

    const existing = db.prepare('SELECT id FROM materials WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Material not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE materials 
      SET name = ?, category = ?, file_path = ?, department = ?, share_scope = ?, verified = ?
      WHERE id = ?
    `)
    stmt.run(name, category, file_path, department, share_scope, verified, id)

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id)
    res.json({ success: true, data: material })
  } catch (error) {
    console.error('Update material error:', error)
    res.status(500).json({ success: false, error: 'Failed to update material' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM materials WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Material not found' })
      return
    }

    db.prepare('DELETE FROM material_reuse_log WHERE material_id = ?').run(id)
    db.prepare('DELETE FROM materials WHERE id = ?').run(id)
    res.json({ success: true, data: { message: 'Material deleted successfully' } })
  } catch (error) {
    console.error('Delete material error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete material' })
  }
})

router.post('/:id/reuse', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { service_application_id, used_by_department } = req.body

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id)
    if (!material) {
      res.status(404).json({ success: false, error: 'Material not found' })
      return
    }

    if ((material as any).share_scope && (material as any).share_scope.indexOf(used_by_department) === -1 && (material as any).share_scope.indexOf('全部门共享') === -1) {
      res.status(400).json({ success: false, error: 'Material is not shared with this department' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO material_reuse_log (material_id, service_application_id, used_by_department)
      VALUES (?, ?, ?)
    `)
    const result = stmt.run(
      id,
      service_application_id || null,
      used_by_department || null
    )

    const log = db.prepare('SELECT * FROM material_reuse_log WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: log })
  } catch (error) {
    console.error('Log material reuse error:', error)
    res.status(500).json({ success: false, error: 'Failed to log material reuse' })
  }
})

router.get('/reuse-logs', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', material_id, used_by_department } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (material_id) {
      whereClauses.push('material_id = ?')
      params.push(material_id)
    }
    if (used_by_department) {
      whereClauses.push('used_by_department = ?')
      params.push(used_by_department)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM material_reuse_log ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT mrl.*, m.name as material_name, m.category as material_category,
             e.name as enterprise_name
      FROM material_reuse_log mrl
      LEFT JOIN materials m ON mrl.material_id = m.id
      LEFT JOIN enterprises e ON m.enterprise_id = e.id
      ${whereSql}
      ORDER BY mrl.used_at DESC
      LIMIT ? OFFSET ?
    `)
    const logs = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: logs, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get reuse logs error:', error)
    res.status(500).json({ success: false, error: 'Failed to get reuse logs' })
  }
})

router.get('/share/available', (req: Request, res: Response): void => {
  try {
    const { department, category } = req.query

    let whereClauses: string[] = ['verified = ?']
    let params: any[] = [1]

    if (department) {
      whereClauses.push('(share_scope LIKE ? OR share_scope LIKE ?)')
      params.push(`%${department}%`, '%全部门共享%')
    }
    if (category) {
      whereClauses.push('category = ?')
      params.push(category)
    }

    const whereSql = whereClauses.join(' AND ')

    const materials = db.prepare(`
      SELECT m.*, e.name as enterprise_name
      FROM materials m
      LEFT JOIN enterprises e ON m.enterprise_id = e.id
      WHERE ${whereSql}
      ORDER BY m.id DESC
    `).all(...params)

    res.json({ success: true, data: materials })
  } catch (error) {
    console.error('Get shared materials error:', error)
    res.status(500).json({ success: false, error: 'Failed to get shared materials' })
  }
})

router.get('/categories', (req: Request, res: Response): void => {
  try {
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM materials 
      GROUP BY category
    `).all()

    res.json({ success: true, data: categories })
  } catch (error) {
    console.error('Get material categories error:', error)
    res.status(500).json({ success: false, error: 'Failed to get material categories' })
  }
})

export default router
