import { Router } from 'express'
import db, { parseProducts } from '../db'

const router = Router()

router.get('/', (req, res) => {
  const type = req.query.type as string | undefined
  const city = req.query.city as string | undefined

  let sql = `SELECT * FROM products WHERE 1=1`
  const params: any[] = []
  if (type) { sql += ' AND type = ?'; params.push(type) }
  if (city) { sql += ' AND city = ?'; params.push(city) }
  sql += ' ORDER BY price DESC'

  const rows = db.prepare(sql).all(...params)
  res.json(parseProducts(rows as any))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
  if (!row) { res.status(404).json({ error: 'Product not found' }); return }
  const [parsed] = parseProducts([row] as any)
  res.json(parsed)
})

export default router
