import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
  const merchant_id = req.query.merchant_id as string
  const type = req.query.type as string
  const status = (req.query.status as string) || 'active'

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (merchant_id) {
    where += ' AND p.merchant_id = ?'
    params.push(merchant_id)
  }
  if (type) {
    where += ' AND p.type = ?'
    params.push(type)
  }
  if (status) {
    where += ' AND p.status = ?'
    params.push(status)
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM packages p ${where}`).get(...params) as { count: number }).count
  const offset = (page - 1) * pageSize
  const items = db.prepare(`
    SELECT p.*, m.name as merchant_name, m.category as merchant_category, m.street as merchant_street
    FROM packages p LEFT JOIN merchants m ON p.merchant_id = m.id
    ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  res.json({
    code: 200,
    message: 'ok',
    data: { items, total, page, pageSize },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const pkg = db.prepare(`
    SELECT p.*, m.name as merchant_name, m.category as merchant_category, m.street as merchant_street
    FROM packages p LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE p.id = ?
  `).get(req.params.id)

  if (!pkg) {
    res.status(404).json({ code: 404, message: '套餐不存在', data: null })
    return
  }

  res.json({ code: 200, message: 'ok', data: pkg })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { merchant_id, name, type, original_price, price, description, stock, start_time, end_time, timeslot_start, timeslot_end } = req.body

  if (!merchant_id || !name || !type || isNaN(original_price) || isNaN(price)) {
    res.status(400).json({ code: 400, message: '缺少必要字段', data: null })
    return
  }

  const merchant = db.prepare('SELECT id FROM merchants WHERE id = ?').get(merchant_id)
  if (!merchant) {
    res.status(404).json({ code: 404, message: '商户不存在', data: null })
    return
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO packages (id, merchant_id, name, type, original_price, price, description, stock, sold, start_time, end_time, timeslot_start, timeslot_end, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'active')
  `).run(id, merchant_id, name, type, original_price, price, description || '', stock || 0, start_time || '', end_time || '', timeslot_start || '', timeslot_end || '')

  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(id)
  res.status(201).json({ code: 201, message: 'ok', data: pkg })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id)
  if (!pkg) {
    res.status(404).json({ code: 404, message: '套餐不存在', data: null })
    return
  }

  const { name, type, original_price, price, description, stock, start_time, end_time, timeslot_start, timeslot_end, status } = req.body
  db.prepare(`
    UPDATE packages SET name = COALESCE(?, name), type = COALESCE(?, type), original_price = COALESCE(?, original_price),
    price = COALESCE(?, price), description = COALESCE(?, description), stock = COALESCE(?, stock),
    start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time),
    timeslot_start = COALESCE(?, timeslot_start), timeslot_end = COALESCE(?, timeslot_end),
    status = COALESCE(?, status) WHERE id = ?
  `).run(name, type, original_price, price, description, stock, start_time, end_time, timeslot_start, timeslot_end, status, req.params.id)

  const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id)
  res.json({ code: 200, message: 'ok', data: updated })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id)
  if (!pkg) {
    res.status(404).json({ code: 404, message: '套餐不存在', data: null })
    return
  }

  db.prepare('DELETE FROM packages WHERE id = ?').run(req.params.id)
  res.json({ code: 200, message: 'ok', data: null })
})

export default router
