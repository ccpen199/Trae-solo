import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

interface NewsRow {
  id: string
  title: string
  category: string
  summary: string
  content: string
  publish_date: string
  source: string
  tags: string
  created_at: string
}

function formatNews(row: NewsRow) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    summary: row.summary,
    content: row.content,
    publishDate: row.publish_date,
    source: row.source,
    tags: JSON.parse(row.tags || '[]'),
    createdAt: row.created_at,
  }
}

router.get('/news', (req: Request, res: Response): void => {
  try {
    const { category } = req.query
    let sql = 'SELECT * FROM news_articles WHERE 1=1'
    const params: unknown[] = []

    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }

    sql += ' ORDER BY publish_date DESC'

    const rows = db.prepare(sql).all(...params) as NewsRow[]
    res.json({ success: true, data: rows.map(formatNews) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取资讯列表失败' })
  }
})

router.get('/news/:id', (req: Request, res: Response): void => {
  try {
    const row = db.prepare('SELECT * FROM news_articles WHERE id = ?').get(req.params.id) as NewsRow | undefined
    if (!row) {
      res.status(404).json({ success: false, error: '资讯不存在' })
      return
    }
    res.json({ success: true, data: formatNews(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取资讯详情失败' })
  }
})

router.get('/reports', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare("SELECT * FROM news_articles WHERE category = 'report' ORDER BY publish_date DESC").all() as NewsRow[]
    const reports = rows.map(row => {
      const contentObj = parseReportContent(row.content)
      return {
        id: row.id,
        quarter: extractQuarter(row.publish_date),
        year: new Date(row.publish_date).getFullYear(),
        summary: row.summary,
        supplyDemandBalance: contentObj.supplyDemandBalance,
        capacityTrend: contentObj.capacityTrend,
        topRegions: contentObj.topRegions,
        priceIndex: contentObj.priceIndex,
        publishDate: row.publish_date,
        source: row.source,
        tags: JSON.parse(row.tags || '[]'),
      }
    })
    res.json({ success: true, data: reports })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取报告列表失败' })
  }
})

router.get('/reports/latest', (req: Request, res: Response): void => {
  try {
    const row = db.prepare("SELECT * FROM news_articles WHERE category = 'report' ORDER BY publish_date DESC LIMIT 1").get() as NewsRow | undefined
    if (!row) {
      res.status(404).json({ success: false, error: '暂无报告' })
      return
    }
    const contentObj = parseReportContent(row.content)
    res.json({
      success: true,
      data: {
        id: row.id,
        quarter: extractQuarter(row.publish_date),
        year: new Date(row.publish_date).getFullYear(),
        summary: row.summary,
        supplyDemandBalance: contentObj.supplyDemandBalance,
        capacityTrend: contentObj.capacityTrend,
        topRegions: contentObj.topRegions,
        priceIndex: contentObj.priceIndex,
        publishDate: row.publish_date,
        source: row.source,
        tags: JSON.parse(row.tags || '[]'),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取最新报告失败' })
  }
})

function extractQuarter(dateStr: string): string {
  const month = new Date(dateStr).getMonth() + 1
  if (month <= 3) return 'Q1'
  if (month <= 6) return 'Q2'
  if (month <= 9) return 'Q3'
  return 'Q4'
}

function parseReportContent(_content: string) {
  return {
    supplyDemandBalance: 1.08,
    capacityTrend: [
      { month: '1月', supply: 8500, demand: 7200 },
      { month: '2月', supply: 7800, demand: 6800 },
      { month: '3月', supply: 9200, demand: 8100 },
      { month: '4月', supply: 9500, demand: 8600 },
      { month: '5月', supply: 10200, demand: 9400 },
      { month: '6月', supply: 10800, demand: 10100 },
    ],
    topRegions: ['嘉兴濮院', '东莞大朗', '桐乡', '绍兴', '杭州'],
    priceIndex: [
      { category: '羊毛衫', current: 128.5, change: 3.2 },
      { category: '羊绒衫', current: 356.0, change: 8.5 },
      { category: '针织衫', current: 58.2, change: -1.8 },
      { category: '混纺毛衫', current: 95.0, change: 2.1 },
    ],
  }
}

export default router
