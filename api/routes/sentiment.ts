import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/keywords', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, category, limit = '20' } = req.query
    const l = Number(limit)

    const conditions: string[] = []
    const params: any[] = []

    if (date) {
      conditions.push('date = ?')
      params.push(date)
    }
    if (category) {
      conditions.push('category = ?')
      params.push(category)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const list = db.prepare(`
      SELECT * FROM sentiment_keywords ${whereClause}
      ORDER BY count DESC
      LIMIT ?
    `).all(...params, l)

    res.json({ success: true, data: list })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取情感关键词失败' })
  }
})

router.get('/trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword, days = '7' } = req.query
    const d = Number(days)

    const list = db.prepare(`
      SELECT date, count
      FROM sentiment_keywords
      WHERE keyword = ? AND date >= date('now', ? || ' days')
      ORDER BY date ASC
    `).all(keyword, `-${d}`)

    res.json({ success: true, data: list })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取关键词趋势失败' })
  }
})

router.get('/hot', async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = db.prepare(`
      SELECT keyword, SUM(count) as total_count
      FROM sentiment_keywords
      GROUP BY keyword
      ORDER BY total_count DESC
      LIMIT 10
    `).all()

    res.json({ success: true, data: list })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取热门话题失败' })
  }
})

export default router
