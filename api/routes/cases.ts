import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'
import { toCaseItem, toMaterial, toNode } from '../utils.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { style, houseType, areaMin, areaMax, budgetMin, budgetMax, page = '1', limit = '10' } = req.query

  let sql = `SELECT c.*, d.name as designer_name
    FROM cases c LEFT JOIN designers d ON c.designer_id = d.id WHERE c.status = 'approved'`
  const params: unknown[] = []

  if (style) {
    sql += ' AND c.style = ?'
    params.push(style)
  }
  if (houseType) {
    sql += ' AND c.house_type = ?'
    params.push(houseType)
  }
  if (areaMin) {
    sql += ' AND c.area >= ?'
    params.push(Number(areaMin))
  }
  if (areaMax) {
    sql += ' AND c.area <= ?'
    params.push(Number(areaMax))
  }
  if (budgetMin) {
    sql += ' AND c.budget_max >= ?'
    params.push(Number(budgetMin))
  }
  if (budgetMax) {
    sql += ' AND c.budget_min <= ?'
    params.push(Number(budgetMax))
  }

  const countSql = sql.replace('SELECT c.*, d.name as designer_name', 'SELECT COUNT(*) as total')
  const totalResult = db.prepare(countSql).get(...params) as { total: number }
  const total = totalResult.total

  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.max(1, Math.min(50, Number(limit)))
  const offset = (pageNum - 1) * limitNum

  sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
  params.push(limitNum, offset)

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
  const items = rows.map(toCaseItem)

  res.json({
    success: true,
    data: {
      items,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const row = db.prepare(`
    SELECT c.*, d.name as designer_name
    FROM cases c LEFT JOIN designers d ON c.designer_id = d.id WHERE c.id = ?
  `).get(id) as Record<string, unknown>

  if (!row) {
    res.status(404).json({ success: false, error: '案例不存在' })
    return
  }

  db.prepare('UPDATE cases SET views = views + 1 WHERE id = ?').run(id)

  const materials = db.prepare('SELECT * FROM case_materials WHERE case_id = ? ORDER BY area, id').all(id) as Record<string, unknown>[]
  const nodes = db.prepare('SELECT * FROM case_construction_nodes WHERE case_id = ? ORDER BY order_num').all(id) as Record<string, unknown>[]

  const result = {
    ...toCaseItem(row),
    materials: materials.map(toMaterial),
    constructionNodes: nodes.map(toNode),
  }

  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const { title, designer_id, style, house_type, area, budget_min, budget_max, city, description, cover_image, floor_plan, images } = req.body

  if (!title || !style || !house_type || !area) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const id = uuidv4()
  db.prepare(`INSERT INTO cases (id, title, designer_id, style, house_type, area, budget_min, budget_max, city, description, cover_image, floor_plan, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, title, designer_id || null, style, house_type, area, budget_min || null, budget_max || null, city || null, description || null, cover_image || null, floor_plan || null, images || ''
  )

  const row = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as Record<string, unknown>
  res.status(201).json({ success: true, data: toCaseItem(row) })
})

router.put('/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status } = req.body

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, error: '无效的状态值' })
    return
  }

  const existing = db.prepare('SELECT id FROM cases WHERE id = ?').get(id)
  if (!existing) {
    res.status(404).json({ success: false, error: '案例不存在' })
    return
  }

  db.prepare("UPDATE cases SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)

  const row = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as Record<string, unknown>
  res.json({ success: true, data: toCaseItem(row) })
})

export default router
