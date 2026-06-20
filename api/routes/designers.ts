import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'
import { toDesigner, toCaseItem } from '../utils.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { region, style, priceMin, priceMax } = req.query

  let sql = `SELECT d.*, GROUP_CONCAT(ds.style) as styles
    FROM designers d LEFT JOIN designer_styles ds ON d.id = ds.designer_id WHERE 1=1`
  const params: unknown[] = []

  if (region) {
    sql += ' AND d.region = ?'
    params.push(region)
  }
  if (priceMin) {
    sql += ' AND d.price_min >= ?'
    params.push(Number(priceMin))
  }
  if (priceMax) {
    sql += ' AND d.price_max <= ?'
    params.push(Number(priceMax))
  }
  if (style) {
    sql += ' AND d.id IN (SELECT designer_id FROM designer_styles WHERE style = ?)'
    params.push(style)
  }

  sql += ' GROUP BY d.id ORDER BY d.rating DESC'

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
  const items = rows.map(toDesigner)

  res.json({ success: true, data: { items, total: items.length } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const row = db.prepare(`
    SELECT d.*, GROUP_CONCAT(ds.style) as styles
    FROM designers d LEFT JOIN designer_styles ds ON d.id = ds.designer_id
    WHERE d.id = ?
    GROUP BY d.id
  `).get(id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: '设计师不存在' })
    return
  }

  const caseRows = db.prepare("SELECT * FROM cases WHERE designer_id = ? AND status = 'approved' ORDER BY created_at DESC").all(id) as Record<string, unknown>[]

  const result = {
    ...toDesigner(row),
    cases: caseRows.map(toCaseItem),
  }

  res.json({ success: true, data: result })
})

router.post('/:id/appointment', (req: Request, res: Response): void => {
  const { id } = req.params
  const { user_id, contact_name, contact_phone, house_type, area, budget, preferred_date, preferred_time, message } = req.body

  const designer = db.prepare('SELECT id FROM designers WHERE id = ?').get(id)
  if (!designer) {
    res.status(404).json({ success: false, error: '设计师不存在' })
    return
  }

  if (!contact_name || !contact_phone) {
    res.status(400).json({ success: false, error: '缺少联系信息' })
    return
  }

  const appointmentId = uuidv4()
  db.prepare(`INSERT INTO appointments (id, user_id, designer_id, contact_name, contact_phone, house_type, area, budget, preferred_date, preferred_time, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    appointmentId, user_id || null, id, contact_name, contact_phone, house_type || null, area || null, budget || null, preferred_date || null, preferred_time || null, message || null
  )

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId)
  res.status(201).json({ success: true, data: appointment })
})

router.post('/:id/quote', (req: Request, res: Response): void => {
  const { id } = req.params
  const { house_type, area, style } = req.body

  const designer = db.prepare('SELECT * FROM designers WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!designer) {
    res.status(404).json({ success: false, error: '设计师不存在' })
    return
  }

  const areaNum = Number(area) || 100
  const priceMin = Number(designer.price_min) || 300
  const priceMax = Number(designer.price_max) || 800
  const avgPrice = (priceMin + priceMax) / 2
  const designFee = Math.round(areaNum * avgPrice * 0.15)
  const constructionFee = Math.round(areaNum * avgPrice * 0.55)
  const materialFee = Math.round(areaNum * avgPrice * 0.30)
  const total = designFee + constructionFee + materialFee

  res.json({
    success: true,
    data: {
      designerId: id,
      designerName: designer.name,
      houseType: house_type || '三室两厅',
      area: areaNum,
      style: style || '现代简约',
      breakdown: {
        designFee,
        constructionFee,
        materialFee,
      },
      total,
      priceRange: {
        min: Math.round(areaNum * priceMin),
        max: Math.round(areaNum * priceMax),
      },
    },
  })
})

export default router
