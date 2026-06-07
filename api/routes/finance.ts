import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/products', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', keyword, institution_name, status, credit_model } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (keyword) {
      whereClauses.push('(product_name LIKE ? OR institution_name LIKE ? OR description LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (institution_name) {
      whereClauses.push('institution_name = ?')
      params.push(institution_name)
    }
    if (status) {
      whereClauses.push('status = ?')
      params.push(status)
    }
    if (credit_model) {
      whereClauses.push('credit_model LIKE ?')
      params.push(`%${credit_model}%`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM finance_products ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT fp.*,
             (SELECT COUNT(*) FROM finance_applications fa WHERE fa.finance_product_id = fp.id) as application_count
      FROM finance_products fp
      ${whereSql}
      ORDER BY fp.id DESC
      LIMIT ? OFFSET ?
    `)
    const products = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: products, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get finance products error:', error)
    res.status(500).json({ success: false, error: 'Failed to get finance products' })
  }
})

router.get('/products/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const product = db.prepare('SELECT * FROM finance_products WHERE id = ?').get(id)
    if (!product) {
      res.status(404).json({ success: false, error: 'Finance product not found' })
      return
    }

    const applications = db.prepare(`
      SELECT fa.*, e.name as enterprise_name
      FROM finance_applications fa
      LEFT JOIN enterprises e ON fa.enterprise_id = e.id
      WHERE fa.finance_product_id = ?
      ORDER BY fa.applied_at DESC
    `).all(id)

    res.json({ success: true, data: { ...(product as object), applications } })
  } catch (error) {
    console.error('Get finance product detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get finance product' })
  }
})

router.post('/products', (req: Request, res: Response): void => {
  try {
    const { institution_name, product_name, amount_min, amount_max, rate_min, rate_max, term_min, term_max, requirements, credit_model, description, status } = req.body

    if (!institution_name || !product_name) {
      res.status(400).json({ success: false, error: 'institution_name and product_name are required' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO finance_products (institution_name, product_name, amount_min, amount_max, rate_min, rate_max, term_min, term_max, requirements, credit_model, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      institution_name,
      product_name,
      amount_min || null,
      amount_max || null,
      rate_min || null,
      rate_max || null,
      term_min || null,
      term_max || null,
      requirements || null,
      credit_model || null,
      description || null,
      status || 'active'
    )

    const product = db.prepare('SELECT * FROM finance_products WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: product })
  } catch (error) {
    console.error('Create finance product error:', error)
    res.status(500).json({ success: false, error: 'Failed to create finance product' })
  }
})

router.put('/products/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { institution_name, product_name, amount_min, amount_max, rate_min, rate_max, term_min, term_max, requirements, credit_model, description, status } = req.body

    const existing = db.prepare('SELECT id FROM finance_products WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Finance product not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE finance_products 
      SET institution_name = ?, product_name = ?, amount_min = ?, amount_max = ?, rate_min = ?, rate_max = ?, 
          term_min = ?, term_max = ?, requirements = ?, credit_model = ?, description = ?, status = ?
      WHERE id = ?
    `)
    stmt.run(institution_name, product_name, amount_min, amount_max, rate_min, rate_max, term_min, term_max, requirements, credit_model, description, status, id)

    const product = db.prepare('SELECT * FROM finance_products WHERE id = ?').get(id)
    res.json({ success: true, data: product })
  } catch (error) {
    console.error('Update finance product error:', error)
    res.status(500).json({ success: false, error: 'Failed to update finance product' })
  }
})

router.delete('/products/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM finance_products WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Finance product not found' })
      return
    }

    db.prepare('DELETE FROM finance_applications WHERE finance_product_id = ?').run(id)
    db.prepare('DELETE FROM finance_products WHERE id = ?').run(id)
    res.json({ success: true, data: { message: 'Finance product deleted successfully' } })
  } catch (error) {
    console.error('Delete finance product error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete finance product' })
  }
})

router.get('/applications', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', enterprise_id, finance_product_id, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (enterprise_id) {
      whereClauses.push('fa.enterprise_id = ?')
      params.push(enterprise_id)
    }
    if (finance_product_id) {
      whereClauses.push('fa.finance_product_id = ?')
      params.push(finance_product_id)
    }
    if (status) {
      whereClauses.push('fa.status = ?')
      params.push(status)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM finance_applications fa ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT fa.*, e.name as enterprise_name, fp.product_name, fp.institution_name
      FROM finance_applications fa
      LEFT JOIN enterprises e ON fa.enterprise_id = e.id
      LEFT JOIN finance_products fp ON fa.finance_product_id = fp.id
      ${whereSql}
      ORDER BY fa.applied_at DESC
      LIMIT ? OFFSET ?
    `)
    const applications = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: applications, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get finance applications error:', error)
    res.status(500).json({ success: false, error: 'Failed to get finance applications' })
  }
})

router.get('/applications/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const application = db.prepare(`
      SELECT fa.*, e.name as enterprise_name, e.unified_code, e.industry,
             fp.product_name, fp.institution_name, fp.rate_min, fp.rate_max
      FROM finance_applications fa
      LEFT JOIN enterprises e ON fa.enterprise_id = e.id
      LEFT JOIN finance_products fp ON fa.finance_product_id = fp.id
      WHERE fa.id = ?
    `).get(id)

    if (!application) {
      res.status(404).json({ success: false, error: 'Finance application not found' })
      return
    }

    res.json({ success: true, data: application })
  } catch (error) {
    console.error('Get finance application detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get finance application' })
  }
})

router.post('/applications', (req: Request, res: Response): void => {
  try {
    const { enterprise_id, finance_product_id, amount, term, purpose } = req.body

    if (!enterprise_id || !finance_product_id || !amount) {
      res.status(400).json({ success: false, error: 'enterprise_id, finance_product_id, and amount are required' })
      return
    }

    const product = db.prepare('SELECT * FROM finance_products WHERE id = ?').get(finance_product_id) as any
    if (!product) {
      res.status(404).json({ success: false, error: 'Finance product not found' })
      return
    }

    if (product.status !== 'active') {
      res.status(400).json({ success: false, error: 'Finance product is not active' })
      return
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(enterprise_id)
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    if (product.amount_min && amount < product.amount_min) {
      res.status(400).json({ success: false, error: `Amount is below minimum of ${product.amount_min}` })
      return
    }
    if (product.amount_max && amount > product.amount_max) {
      res.status(400).json({ success: false, error: `Amount exceeds maximum of ${product.amount_max}` })
      return
    }

    const creditRecords = db.prepare(`
      SELECT AVG(score) as avg_score FROM credit_records WHERE enterprise_id = ?
    `).get(enterprise_id) as any

    const credit_score = creditRecords?.avg_score || null

    const stmt = db.prepare(`
      INSERT INTO finance_applications (enterprise_id, finance_product_id, amount, term, purpose, credit_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      enterprise_id,
      finance_product_id,
      amount,
      term || null,
      purpose || null,
      credit_score
    )

    const application = db.prepare(`
      SELECT fa.*, e.name as enterprise_name, fp.product_name
      FROM finance_applications fa
      LEFT JOIN enterprises e ON fa.enterprise_id = e.id
      LEFT JOIN finance_products fp ON fa.finance_product_id = fp.id
      WHERE fa.id = ?
    `).get(result.lastInsertRowid)

    res.json({ success: true, data: application })
  } catch (error) {
    console.error('Submit finance application error:', error)
    res.status(500).json({ success: false, error: 'Failed to submit finance application' })
  }
})

router.put('/applications/:id/review', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { status, approved_amount, approved_rate } = req.body

    const existing = db.prepare('SELECT id FROM finance_applications WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Finance application not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE finance_applications 
      SET status = ?, approved_amount = ?, approved_rate = ?, reviewed_at = datetime('now', 'localtime')
      WHERE id = ?
    `)
    stmt.run(status || 'reviewing', approved_amount || null, approved_rate || null, id)

    const application = db.prepare('SELECT * FROM finance_applications WHERE id = ?').get(id)
    res.json({ success: true, data: application })
  } catch (error) {
    console.error('Review finance application error:', error)
    res.status(500).json({ success: false, error: 'Failed to review finance application' })
  }
})

router.get('/institutions', (req: Request, res: Response): void => {
  try {
    const institutions = db.prepare(`
      SELECT institution_name, COUNT(*) as product_count 
      FROM finance_products 
      WHERE status = 'active'
      GROUP BY institution_name
    `).all()

    res.json({ success: true, data: institutions })
  } catch (error) {
    console.error('Get finance institutions error:', error)
    res.status(500).json({ success: false, error: 'Failed to get finance institutions' })
  }
})

export default router
