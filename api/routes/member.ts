import { Router } from 'express'
import db, { parseProducts, mockMember, mockPointRecords } from '../db'

const router = Router()

router.get('/profile', (_req, res) => {
  res.json(mockMember)
})

router.get('/points', (_req, res) => {
  res.json({ points: mockMember.points, records: mockPointRecords })
})

router.get('/benefits', (_req, res) => {
  res.json(mockMember.crossCityBenefits)
})

router.get('/recommendations', (req, res) => {
  const city = req.query.city as string | undefined
  let sql = `SELECT * FROM products WHERE 1=1`
  const params: any[] = []
  if (city) { sql += ' AND city = ?'; params.push(city) }
  sql += ' ORDER BY (rating IS NULL), rating DESC LIMIT 20'
  const rows = db.prepare(sql).all(...params)
  res.json(parseProducts(rows as any))
})

export default router
