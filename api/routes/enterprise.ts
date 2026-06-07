import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', keyword, industry, type, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (keyword) {
      whereClauses.push('(name LIKE ? OR unified_code LIKE ? OR legal_person LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (industry) {
      whereClauses.push('industry = ?')
      params.push(industry)
    }
    if (type) {
      whereClauses.push('type = ?')
      params.push(type)
    }
    if (status) {
      whereClauses.push('status = ?')
      params.push(status)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM enterprises ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT e.*, 
             (SELECT COUNT(*) FROM service_applications sa WHERE sa.enterprise_id = e.id) as service_count,
             (SELECT COUNT(*) FROM appeals a WHERE a.enterprise_id = e.id) as appeal_count
      FROM enterprises e
      ${whereSql}
      ORDER BY e.id DESC
      LIMIT ? OFFSET ?
    `)
    const enterprises = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: enterprises, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get enterprises error:', error)
    res.status(500).json({ success: false, error: 'Failed to get enterprises' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id) as any
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const creditRecords = db.prepare('SELECT * FROM credit_records WHERE enterprise_id = ? ORDER BY id DESC').all(id)
    const serviceApplications = db.prepare(`
      SELECT sa.*, si.name as service_name 
      FROM service_applications sa 
      LEFT JOIN service_items si ON sa.service_item_id = si.id 
      WHERE sa.enterprise_id = ? 
      ORDER BY sa.id DESC
    `).all(id)
    const appeals = db.prepare('SELECT * FROM appeals WHERE enterprise_id = ? ORDER BY id DESC').all(id)
    const policies = db.prepare(`
      SELECT p.*, pm.match_score, pm.status as match_status 
      FROM policy_matches pm 
      LEFT JOIN policies p ON pm.policy_id = p.id 
      WHERE pm.enterprise_id = ? 
      ORDER BY pm.id DESC
    `).all(id)

    res.json({
      success: true,
      data: {
        ...(enterprise as object),
        creditRecords,
        serviceApplications,
        appeals,
        matchedPolicies: policies
      }
    })
  } catch (error) {
    console.error('Get enterprise detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get enterprise detail' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, unified_code, registration_number, type, industry, registered_capital, legal_person, address, contact_phone, status, established_date } = req.body

    if (!name || !unified_code) {
      res.status(400).json({ success: false, error: 'Name and unified_code are required' })
      return
    }

    const existing = db.prepare('SELECT id FROM enterprises WHERE unified_code = ?').get(unified_code)
    if (existing) {
      res.status(400).json({ success: false, error: 'Enterprise with this unified_code already exists' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO enterprises (name, unified_code, registration_number, type, industry, registered_capital, legal_person, address, contact_phone, status, established_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      name,
      unified_code,
      registration_number || null,
      type || 'limited',
      industry || null,
      registered_capital || 0,
      legal_person || null,
      address || null,
      contact_phone || null,
      status || 'active',
      established_date || null
    )

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: enterprise })
  } catch (error) {
    console.error('Create enterprise error:', error)
    res.status(500).json({ success: false, error: 'Failed to create enterprise' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, unified_code, registration_number, type, industry, registered_capital, legal_person, address, contact_phone, status, established_date } = req.body

    const existing = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE enterprises 
      SET name = ?, unified_code = ?, registration_number = ?, type = ?, industry = ?, 
          registered_capital = ?, legal_person = ?, address = ?, contact_phone = ?, 
          status = ?, established_date = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `)
    stmt.run(
      name,
      unified_code,
      registration_number,
      type,
      industry,
      registered_capital,
      legal_person,
      address,
      contact_phone,
      status,
      established_date,
      id
    )

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id)
    res.json({ success: true, data: enterprise })
  } catch (error) {
    console.error('Update enterprise error:', error)
    res.status(500).json({ success: false, error: 'Failed to update enterprise' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    db.prepare('DELETE FROM enterprises WHERE id = ?').run(id)
    res.json({ success: true, data: { message: 'Enterprise deleted successfully' } })
  } catch (error) {
    console.error('Delete enterprise error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete enterprise' })
  }
})

router.get('/search/advanced', (req: Request, res: Response): void => {
  try {
    const { min_capital, max_capital, start_date, end_date } = req.query

    let whereClauses: string[] = ['status = ?']
    let params: any[] = ['active']

    if (min_capital) {
      whereClauses.push('registered_capital >= ?')
      params.push(Number(min_capital))
    }
    if (max_capital) {
      whereClauses.push('registered_capital <= ?')
      params.push(Number(max_capital))
    }
    if (start_date) {
      whereClauses.push('established_date >= ?')
      params.push(start_date)
    }
    if (end_date) {
      whereClauses.push('established_date <= ?')
      params.push(end_date)
    }

    const whereSql = whereClauses.join(' AND ')
    const enterprises = db.prepare(`SELECT * FROM enterprises WHERE ${whereSql} ORDER BY registered_capital DESC`).all(...params)

    res.json({ success: true, data: enterprises })
  } catch (error) {
    console.error('Advanced search enterprises error:', error)
    res.status(500).json({ success: false, error: 'Failed to search enterprises' })
  }
})

export default router
