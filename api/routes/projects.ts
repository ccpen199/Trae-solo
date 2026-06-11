import express, { type Request, type Response } from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
  const {
    industry,
    minInvestment,
    maxInvestment,
    investment_min,
    investment_max,
    city,
    province,
    freeJoining,
    free_joining,
    category,
    keyword,
    page = 1,
    pageSize = 10,
    status,
    brandId,
    brand_id,
  } = req.query

  let whereClause: string[] = []
  let params: any[] = []

  if (status) {
    whereClause.push('p.status = ?')
    params.push(status)
  } else {
    whereClause.push('p.status = ?')
    params.push('approved')
  }

  if (industry) {
    whereClause.push('p.industry = ?')
    params.push(industry)
  }

  if (category) {
    whereClause.push('p.category = ?')
    params.push(category)
  }

  const minValue = minInvestment || investment_min
  const maxValue = maxInvestment || investment_max
  if (minValue) {
    whereClause.push('p.investment_max >= ?')
    params.push(parseInt(minValue as string))
  }

  if (maxValue) {
    whereClause.push('p.investment_min <= ?')
    params.push(parseInt(maxValue as string))
  }

  if (city) {
    whereClause.push('p.city LIKE ?')
    params.push(`%${city}%`)
  }

  if (province) {
    whereClause.push('p.province LIKE ?')
    params.push(`%${province}%`)
  }

  if (freeJoining === '1' || freeJoining === 'true' || free_joining === '1' || free_joining === 'true') {
    whereClause.push('p.free_joining = 1')
  }

  const brandFilter = brandId || brand_id
  if (brandFilter) {
    whereClause.push('p.brand_id = ?')
    params.push(parseInt(brandFilter as string))
  }

  if (keyword) {
    whereClause.push('(p.name LIKE ? OR p.description LIKE ? OR u.name LIKE ? OR bp.company_name LIKE ?)')
    const likeKeyword = `%${keyword}%`
    params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword)
  }

  const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : ''

  const countSql = `
    SELECT COUNT(*) as total
    FROM projects p
    LEFT JOIN users u ON p.brand_id = u.id
    LEFT JOIN brand_profiles bp ON p.brand_id = bp.user_id
    ${whereSql}
  `

  const totalResult = db.prepare(countSql).get(...params) as { total: number }
  const total = totalResult.total

  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string)
  const limit = parseInt(pageSize as string)

  const sql = `
    SELECT p.*, u.name as brand_name, bp.company_name
    FROM projects p
    LEFT JOIN users u ON p.brand_id = u.id
    LEFT JOIN brand_profiles bp ON p.brand_id = bp.user_id
    ${whereSql}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `

  const projects = db.prepare(sql).all(...params, limit, offset)

  res.json({
    success: true,
    data: {
      list: projects,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    },
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params

  const project = db
    .prepare(
      `SELECT p.*, u.name as brand_name, bp.company_name, bp.total_stores, bp.established_year, bp.description as brand_description
       FROM projects p
       LEFT JOIN users u ON p.brand_id = u.id
       LEFT JOIN brand_profiles bp ON p.brand_id = bp.user_id
       WHERE p.id = ?`
    )
    .get(id)

  if (!project) {
    return res.status(404).json({
      success: false,
      error: '项目不存在',
    })
  }

  db.prepare('UPDATE projects SET view_count = view_count + 1 WHERE id = ?').run(id)

  res.json({
    success: true,
    data: project,
  })
})

router.post('/', (req: Request, res: Response) => {
  const {
    brand_id,
    name,
    industry,
    category,
    investment_min,
    investment_max,
    free_joining,
    area_required,
    profit_model,
    description,
    cover_image,
    video_url,
    province,
    city,
    address,
  } = req.body

  if (!brand_id || !name || !industry || !investment_min || !investment_max) {
    return res.status(400).json({
      success: false,
      error: '必填字段不能为空',
    })
  }

  const result = db
    .prepare(
      `INSERT INTO projects (brand_id, name, industry, category, investment_min, investment_max, free_joining, area_required, profit_model, description, cover_image, video_url, province, city, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      brand_id,
      name,
      industry,
      category || '',
      investment_min,
      investment_max,
      free_joining || 0,
      area_required || '',
      profit_model || '',
      description || '',
      cover_image || '',
      video_url || '',
      province || '',
      city || '',
      address || ''
    )

  const projectId = result.lastInsertRowid

  db.prepare(
    'INSERT INTO project_reviews (project_id, status) VALUES (?, ?)'
  ).run(projectId, 'pending')

  res.json({
    success: true,
    data: {
      id: projectId,
      status: 'pending',
    },
  })
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: '项目不存在',
    })
  }

  const allowedFields = [
    'name',
    'industry',
    'category',
    'investment_min',
    'investment_max',
    'free_joining',
    'area_required',
    'profit_model',
    'description',
    'province',
    'city',
    'address',
  ]
  const fields: string[] = []
  const values: any[] = []

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = ?`)
      values.push(req.body[field])
    }
  }

  if (fields.length === 0) {
    return res.json({
      success: true,
      data: existing,
    })
  }

  values.push(id)
  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)

  res.json({
    success: true,
    data: project,
  })
})

router.put('/:id/review', (req: Request, res: Response) => {
  const { id } = req.params
  const {
    reviewer_id,
    status,
    due_diligence_report,
    profit_verification,
    mengxintong_binding,
    comments,
  } = req.body

  if (!reviewer_id || !status) {
    return res.status(400).json({
      success: false,
      error: '审核人ID和状态不能为空',
    })
  }

  const existingReview = db.prepare('SELECT id FROM project_reviews WHERE project_id = ?').get(id)

  if (existingReview) {
    db.prepare(
      `UPDATE project_reviews 
       SET status = ?, due_diligence_report = ?, profit_verification = ?, mengxintong_binding = ?, comments = ?, reviewed_at = CURRENT_TIMESTAMP, reviewer_id = ?
       WHERE project_id = ?`
    ).run(
      status,
      due_diligence_report || '',
      profit_verification || '',
      mengxintong_binding || '',
      comments || '',
      reviewer_id,
      id
    )
  } else {
    db.prepare(
      `INSERT INTO project_reviews (project_id, reviewer_id, status, due_diligence_report, profit_verification, mengxintong_binding, comments, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(
      id,
      reviewer_id,
      status,
      due_diligence_report || '',
      profit_verification || '',
      mengxintong_binding || '',
      comments || ''
    )
  }

  db.prepare('UPDATE projects SET status = ? WHERE id = ?').run(status, id)

  if (status === 'approved' && mengxintong_binding) {
    db.prepare('UPDATE projects SET mengxintong_certified = 1 WHERE id = ?').run(id)
  }

  res.json({
    success: true,
    data: {
      project_id: id,
      status,
    },
  })
})

router.get('/:id/review', (req: Request, res: Response) => {
  const { id } = req.params

  const review = db
    .prepare(
      `SELECT pr.*, u.name as reviewer_name
       FROM project_reviews pr
       LEFT JOIN users u ON pr.reviewer_id = u.id
       WHERE pr.project_id = ?
       ORDER BY pr.created_at DESC
       LIMIT 1`
    )
    .get(id)

  res.json({
    success: true,
    data: review || null,
  })
})

export default router
