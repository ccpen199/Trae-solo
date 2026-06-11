import express, { type Request, type Response } from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
  const { brandId, entrepreneurId, stage, page = 1, pageSize = 20 } = req.query

  let whereClause: string[] = []
  let params: any[] = []

  if (brandId) {
    whereClause.push('p.brand_id = ?')
    params.push(parseInt(brandId as string))
  }

  if (entrepreneurId) {
    whereClause.push('f.entrepreneur_id = ?')
    params.push(parseInt(entrepreneurId as string))
  }

  if (stage) {
    whereClause.push('f.stage = ?')
    params.push(stage)
  }

  const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : ''

  const countSql = `
    SELECT COUNT(*) as total
    FROM franchisee_lifecycle f
    LEFT JOIN projects p ON f.project_id = p.id
    ${whereSql}
  `

  const totalResult = db.prepare(countSql).get(...params) as { total: number }
  const total = totalResult.total

  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string)
  const limit = parseInt(pageSize as string)

  const sql = `
    SELECT f.*, p.name as project_name, p.industry, p.category,
           u1.name as entrepreneur_name, u1.phone as entrepreneur_phone,
           u2.name as brand_name
    FROM franchisee_lifecycle f
    LEFT JOIN projects p ON f.project_id = p.id
    LEFT JOIN users u1 ON f.entrepreneur_id = u1.id
    LEFT JOIN users u2 ON p.brand_id = u2.id
    ${whereSql}
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `

  const franchisees = db.prepare(sql).all(...params, limit, offset)

  res.json({
    success: true,
    data: {
      list: franchisees,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    },
  })
})

router.get('/stats', (req: Request, res: Response) => {
  const { brandId } = req.query

  let brandWhere = ''
  let params: any[] = []

  if (brandId) {
    brandWhere = 'WHERE p.brand_id = ?'
    params.push(parseInt(brandId as string))
  }

  const stageStats = db.prepare(`
    SELECT stage, COUNT(*) as count
    FROM franchisee_lifecycle f
    LEFT JOIN projects p ON f.project_id = p.id
    ${brandWhere}
    GROUP BY stage
  `).all(...params)

  const total = db.prepare(`
    SELECT COUNT(*) as count, SUM(signed_amount) as total_amount
    FROM franchisee_lifecycle f
    LEFT JOIN projects p ON f.project_id = p.id
    ${brandWhere}
  `).get(...params) as { count: number; total_amount: number | null }

  res.json({
    success: true,
    data: {
      stageStats,
      totalFranchisees: total.count,
      totalSignedAmount: total.total_amount || 0,
    },
  })
})

router.post('/', (req: Request, res: Response) => {
  const {
    project_id,
    entrepreneur_id,
    stage,
    contact_name,
    contact_phone,
    intended_amount,
    notes,
  } = req.body

  if (!project_id || !stage || !contact_name || !contact_phone) {
    return res.status(400).json({
      success: false,
      error: '必填字段不能为空',
    })
  }

  const result = db
    .prepare(
      `INSERT INTO franchisee_lifecycle (project_id, entrepreneur_id, stage, contact_name, contact_phone, intended_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      project_id,
      entrepreneur_id || null,
      stage,
      contact_name,
      contact_phone,
      intended_amount || null,
      notes || ''
    )

  res.json({
    success: true,
    data: {
      id: result.lastInsertRowid,
    },
  })
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const {
    stage,
    signed_amount,
    signed_date,
    store_name,
    store_address,
    opened_date,
    repurchase_amount,
    repurchase_date,
    notes,
  } = req.body

  const existing = db.prepare('SELECT * FROM franchisee_lifecycle WHERE id = ?').get(id)
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: '记录不存在',
    })
  }

  db.prepare(
    `UPDATE franchisee_lifecycle 
     SET stage = ?, signed_amount = ?, signed_date = ?, store_name = ?, 
         store_address = ?, opened_date = ?, repurchase_amount = ?, 
         repurchase_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    stage || (existing as any).stage,
    signed_amount !== undefined ? signed_amount : (existing as any).signed_amount,
    signed_date || (existing as any).signed_date,
    store_name !== undefined ? store_name : (existing as any).store_name,
    store_address !== undefined ? store_address : (existing as any).store_address,
    opened_date || (existing as any).opened_date,
    repurchase_amount !== undefined ? repurchase_amount : (existing as any).repurchase_amount,
    repurchase_date || (existing as any).repurchase_date,
    notes !== undefined ? notes : (existing as any).notes,
    id
  )

  res.json({
    success: true,
    data: {
      id,
      stage: stage || (existing as any).stage,
    },
  })
})

router.get('/:id/performance', (req: Request, res: Response) => {
  const { id } = req.params

  const performance = db
    .prepare(
      `SELECT * FROM performance_monitoring 
       WHERE franchisee_id = ? 
       ORDER BY month DESC`
    )
    .all(id)

  res.json({
    success: true,
    data: performance,
  })
})

router.post('/:id/performance', (req: Request, res: Response) => {
  const { id } = req.params
  const { month, revenue, profit, customer_count, compliance_score, notes } = req.body

  if (!month) {
    return res.status(400).json({
      success: false,
      error: '月份不能为空',
    })
  }

  const result = db
    .prepare(
      `INSERT INTO performance_monitoring (franchisee_id, month, revenue, profit, customer_count, compliance_score, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      month,
      revenue || 0,
      profit || 0,
      customer_count || 0,
      compliance_score || 0,
      notes || ''
    )

  res.json({
    success: true,
    data: {
      id: result.lastInsertRowid,
    },
  })
})

export default router
