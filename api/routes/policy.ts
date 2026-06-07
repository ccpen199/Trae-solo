import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', keyword, category, department_id, status, target_industry, target_enterprise_type } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (keyword) {
      whereClauses.push('(title LIKE ? OR description LIKE ?)')
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
    if (target_industry) {
      whereClauses.push('(target_industry = ? OR target_industry = ?)')
      params.push(target_industry, '全行业')
    }
    if (target_enterprise_type) {
      whereClauses.push('target_enterprise_type = ?')
      params.push(target_enterprise_type)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM policies ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT p.*, d.name as department_name 
      FROM policies p 
      LEFT JOIN departments d ON p.department_id = d.id
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `)
    const policies = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: policies, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get policies error:', error)
    res.status(500).json({ success: false, error: 'Failed to get policies' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const policy = db.prepare(`
      SELECT p.*, d.name as department_name 
      FROM policies p 
      LEFT JOIN departments d ON p.department_id = d.id 
      WHERE p.id = ?
    `).get(id) as any

    if (!policy) {
      res.status(404).json({ success: false, error: 'Policy not found' })
      return
    }

    const matchCount = db.prepare('SELECT COUNT(*) as count FROM policy_matches WHERE policy_id = ?').get(id) as any

    res.json({ success: true, data: { ...(policy as object), match_count: matchCount.count } })
  } catch (error) {
    console.error('Get policy detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get policy' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { title, category, department_id, description, conditions, amount, valid_from, valid_to, target_industry, target_enterprise_type, status } = req.body

    if (!title || !category) {
      res.status(400).json({ success: false, error: 'Title and category are required' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO policies (title, category, department_id, description, conditions, amount, valid_from, valid_to, target_industry, target_enterprise_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      title,
      category,
      department_id || null,
      description || null,
      conditions || null,
      amount || null,
      valid_from || null,
      valid_to || null,
      target_industry || '全行业',
      target_enterprise_type || 'limited',
      status || 'active'
    )

    const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: policy })
  } catch (error) {
    console.error('Create policy error:', error)
    res.status(500).json({ success: false, error: 'Failed to create policy' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { title, category, department_id, description, conditions, amount, valid_from, valid_to, target_industry, target_enterprise_type, status } = req.body

    const existing = db.prepare('SELECT id FROM policies WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Policy not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE policies 
      SET title = ?, category = ?, department_id = ?, description = ?, conditions = ?, 
          amount = ?, valid_from = ?, valid_to = ?, target_industry = ?, target_enterprise_type = ?, status = ?
      WHERE id = ?
    `)
    stmt.run(title, category, department_id, description, conditions, amount, valid_from, valid_to, target_industry, target_enterprise_type, status, id)

    const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(id)
    res.json({ success: true, data: policy })
  } catch (error) {
    console.error('Update policy error:', error)
    res.status(500).json({ success: false, error: 'Failed to update policy' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM policies WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Policy not found' })
      return
    }

    db.prepare('DELETE FROM policy_matches WHERE policy_id = ?').run(id)
    db.prepare('DELETE FROM policies WHERE id = ?').run(id)
    res.json({ success: true, data: { message: 'Policy deleted successfully' } })
  } catch (error) {
    console.error('Delete policy error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete policy' })
  }
})

router.post('/match', (req: Request, res: Response): void => {
  try {
    const { enterprise_id } = req.body

    if (!enterprise_id) {
      res.status(400).json({ success: false, error: 'enterprise_id is required' })
      return
    }

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(enterprise_id) as any
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    db.prepare('DELETE FROM policy_matches WHERE enterprise_id = ?').run(enterprise_id)

    const policies = db.prepare(`
      SELECT * FROM policies 
      WHERE status = 'active' 
        AND (target_industry = ? OR target_industry = '全行业')
        AND target_enterprise_type = ?
    `).all(enterprise.industry, enterprise.type) as any[]

    const insertMatch = db.prepare(`
      INSERT INTO policy_matches (enterprise_id, policy_id, match_score, status)
      VALUES (?, ?, ?, ?)
    `)

    const matchedPolicies = []

    for (const policy of policies) {
      let score = 0

      if (policy.target_industry === enterprise.industry) {
        score += 50
      }
      if (policy.target_enterprise_type === enterprise.type) {
        score += 30
      }
      if (enterprise.registered_capital >= 1000000) {
        score += 10
      }
      if (enterprise.status === 'active') {
        score += 10
      }

      const result = insertMatch.run(enterprise_id, policy.id, score, 'recommended')

      matchedPolicies.push({
        ...(policy as object),
        match_score: score,
        match_id: result.lastInsertRowid
      })
    }

    matchedPolicies.sort((a, b) => b.match_score - a.match_score)

    res.json({ success: true, data: matchedPolicies })
  } catch (error) {
    console.error('Policy matching error:', error)
    res.status(500).json({ success: false, error: 'Failed to match policies' })
  }
})

router.get('/enterprise/:enterprise_id', (req: Request, res: Response): void => {
  try {
    const { enterprise_id } = req.params

    const matches = db.prepare(`
      SELECT pm.*, p.*, d.name as department_name
      FROM policy_matches pm
      LEFT JOIN policies p ON pm.policy_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE pm.enterprise_id = ?
      ORDER BY pm.match_score DESC
    `).all(enterprise_id)

    res.json({ success: true, data: matches })
  } catch (error) {
    console.error('Get enterprise matched policies error:', error)
    res.status(500).json({ success: false, error: 'Failed to get matched policies' })
  }
})

router.get('/categories', (req: Request, res: Response): void => {
  try {
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM policies 
      WHERE status = 'active'
      GROUP BY category
    `).all()

    res.json({ success: true, data: categories })
  } catch (error) {
    console.error('Get policy categories error:', error)
    res.status(500).json({ success: false, error: 'Failed to get policy categories' })
  }
})

export default router
