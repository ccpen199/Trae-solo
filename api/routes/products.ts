import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { category } = req.query
  const db = getDb()

  let sql = `
    SELECT p.*, m.name as merchant_name
    FROM products p
    LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE 1=1
  `
  const params: any[] = []

  if (category) {
    const categoryMap: Record<string, string> = {
      '红河特产': '紫陶',
      '生活服务': '美食',
      '二手闲置': '锡器',
    }
    const mappedCategory = categoryMap[category as string] || category
    sql += " AND p.category = ?"
    params.push(mappedCategory)
  }

  sql += " ORDER BY p.created_at DESC"
  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const product = db.prepare(`
    SELECT p.*, m.name as merchant_name, m.category as merchant_category, m.status as merchant_status
    FROM products p
    LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE p.id = ?
  `).get(Number(req.params.id))

  if (!product) {
    res.status(404).json({ success: false, error: '商品不存在' })
    return
  }

  res.json({ success: true, data: product })
})

export default router
