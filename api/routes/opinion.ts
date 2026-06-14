import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/heatmap', (_req: Request, res: Response): void => {
  const data = db.prepare('SELECT region, SUM(heat_value) as total_heat FROM public_opinion GROUP BY region ORDER BY total_heat DESC').all()
  res.json({ success: true, data })
})

router.get('/trends', (_req: Request, res: Response): void => {
  const data = db.prepare("SELECT data_date as date, SUM(heat_value) as total_heat FROM public_opinion GROUP BY data_date ORDER BY data_date").all()
  res.json({ success: true, data })
})

router.get('/', (req: Request, res: Response): void => {
  const conditions: string[] = []
  const params: any[] = []

  if (req.query.keyword) {
    conditions.push('keyword LIKE ?')
    params.push(`%${req.query.keyword}%`)
  }
  if (req.query.region) {
    conditions.push('region = ?')
    params.push(req.query.region)
  }
  if (req.query.sentiment) {
    conditions.push('sentiment = ?')
    params.push(req.query.sentiment)
  }
  if (req.query.date_from) {
    conditions.push('data_date >= ?')
    params.push(req.query.date_from)
  }
  if (req.query.date_to) {
    conditions.push('data_date <= ?')
    params.push(req.query.date_to)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const list = db.prepare(`SELECT * FROM public_opinion ${where} ORDER BY heat_value DESC, created_at DESC`).all(...params)

  res.json({ success: true, data: list })
})

router.post('/', (req: Request, res: Response): void => {
  const { keyword, heat_value, region, source, sentiment, data_date } = req.body
  if (!keyword) {
    res.status(400).json({ success: false, error: 'keyword is required' })
    return
  }

  const result = db.prepare(
    `INSERT INTO public_opinion (keyword, heat_value, region, source, sentiment, data_date) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(keyword, heat_value || 0, region || '广州', source || null, sentiment || 'neutral', data_date || new Date().toISOString().slice(0, 10))

  const record = db.prepare('SELECT * FROM public_opinion WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: record })
})

export default router
