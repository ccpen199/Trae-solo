import express, { type Request, type Response } from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
  const { industry, status, page = 1, pageSize = 20 } = req.query

  let whereClause: string[] = []
  let params: any[] = []

  if (industry) {
    whereClause.push('industry = ?')
    params.push(industry)
  }

  if (status) {
    whereClause.push('status = ?')
    params.push(status)
  }

  const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : ''

  const countSql = `SELECT COUNT(*) as total FROM contract_templates ${whereSql}`
  const totalResult = db.prepare(countSql).get(...params) as { total: number }

  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string)
  const limit = parseInt(pageSize as string)

  const sql = `
    SELECT ct.*, u.name as created_by_name
    FROM contract_templates ct
    LEFT JOIN users u ON ct.created_by = u.id
    ${whereSql}
    ORDER BY ct.created_at DESC
    LIMIT ? OFFSET ?
  `

  const templates = db.prepare(sql).all(...params, limit, offset)

  res.json({
    success: true,
    data: {
      list: templates,
      total: totalResult.total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    },
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params

  const template = db
    .prepare(
      `SELECT ct.*, u.name as created_by_name
       FROM contract_templates ct
       LEFT JOIN users u ON ct.created_by = u.id
       WHERE ct.id = ?`
    )
    .get(id)

  if (!template) {
    return res.status(404).json({
      success: false,
      error: '合同模板不存在',
    })
  }

  res.json({
    success: true,
    data: template,
  })
})

router.post('/', (req: Request, res: Response) => {
  const { name, industry, content, version, created_by } = req.body

  if (!name || !content) {
    return res.status(400).json({
      success: false,
      error: '模板名称和内容不能为空',
    })
  }

  const result = db
    .prepare(
      'INSERT INTO contract_templates (name, industry, content, version, created_by) VALUES (?, ?, ?, ?, ?)'
    )
    .run(
      name,
      industry || '',
      content,
      version || 'v1.0',
      created_by || null
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
  const { name, industry, content, version, status } = req.body

  const existing = db.prepare('SELECT id FROM contract_templates WHERE id = ?').get(id)
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: '合同模板不存在',
    })
  }

  db.prepare(
    `UPDATE contract_templates 
     SET name = ?, industry = ?, content = ?, version = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    name || (existing as any).name,
    industry !== undefined ? industry : (existing as any).industry,
    content || (existing as any).content,
    version || (existing as any).version,
    status || (existing as any).status,
    id
  )

  res.json({
    success: true,
    data: { id },
  })
})

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params

  const result = db.prepare('DELETE FROM contract_templates WHERE id = ?').run(id)

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: '合同模板不存在',
    })
  }

  res.json({
    success: true,
    message: '删除成功',
  })
})

export default router
