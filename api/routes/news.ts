import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

interface NewsItem {
  id: string
  titleZh: string
  titleIt: string
  summaryZh: string
  summaryIt: string
  source: string
  sourceLogo?: string
  tags: string[]
  publishedAt: string
  imageUrl?: string
  originalUrl: string
  fetchedAt: string
}

const formatNewsItem = (row: any): NewsItem => {
  return {
    id: row.id,
    titleZh: row.title_zh,
    titleIt: row.title_it,
    summaryZh: row.summary_zh || '',
    summaryIt: row.summary_it || '',
    source: row.source,
    sourceLogo: row.source_logo || undefined,
    tags: row.tags_json ? JSON.parse(row.tags_json) : [],
    publishedAt: row.published_at,
    imageUrl: row.image_url || undefined,
    originalUrl: row.original_url,
    fetchedAt: row.fetched_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  const { tag, source, keyword } = req.query

  let sql = 'SELECT * FROM news_items WHERE 1=1'
  const params: any[] = []

  if (source) {
    sql += ' AND source = ?'
    params.push(source)
  }
  if (keyword) {
    sql += ' AND (title_zh LIKE ? OR title_it LIKE ? OR summary_zh LIKE ? OR summary_it LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw, kw, kw)
  }
  if (tag) {
    sql += ' AND tags_json LIKE ?'
    params.push(`%${tag}%`)
  }

  sql += ' ORDER BY published_at DESC'

  const rows = db.prepare(sql).all(...params) as any[]
  const newsItems = rows.map(formatNewsItem)

  res.json({
    success: true,
    data: newsItems,
  })
})

router.get('/tags', (req: Request, res: Response): void => {
  const rows = db.prepare('SELECT tags_json FROM news_items WHERE tags_json IS NOT NULL').all() as any[]

  const tagCount: Record<string, number> = {}

  for (const row of rows) {
    try {
      const tags: string[] = JSON.parse(row.tags_json)
      for (const tag of tags) {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      }
    } catch {
      continue
    }
  }

  const tags = Object.entries(tagCount).map(([tag, count]) => ({
    tag,
    count,
  }))

  tags.sort((a, b) => b.count - a.count)

  res.json({
    success: true,
    data: tags,
  })
})

export default router
