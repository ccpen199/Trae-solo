import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/regions', (req: Request, res: Response): void => {
  const db = getDb()
  const { parentCode } = req.query

  let regions: unknown[]
  if (parentCode) {
    regions = db.prepare('SELECT * FROM geo_regions WHERE parent_code = ? ORDER BY code').all(parentCode as string)
  } else {
    regions = db.prepare("SELECT * FROM geo_regions WHERE level = 1 ORDER BY code").all()
  }

  res.json({ success: true, data: regions })
})

router.get('/heatmap', (req: Request, res: Response): void => {
  const db = getDb()

  const regions = db.prepare(
    `SELECT gr.code, gr.name, gr.level, gr.parent_code,
      COALESCE(gr.post_count, 0) as post_count
    FROM geo_regions gr
    ORDER BY gr.level, gr.code`
  ).all()

  res.json({ success: true, data: regions })
})

router.get('/stats', (req: Request, res: Response): void => {
  const db = getDb()
  const { code } = req.query

  if (!code) {
    res.status(400).json({ success: false, error: 'Missing required parameter: code' })
    return
  }

  const region = db.prepare('SELECT * FROM geo_regions WHERE code = ?').get(code as string) as Record<string, unknown> | undefined
  if (!region) {
    res.status(404).json({ success: false, error: 'Region not found' })
    return
  }

  const regionName = region.name as string
  const level = region.level as number

  let postStats: unknown
  if (level === 3) {
    postStats = db.prepare(
      `SELECT COUNT(*) as total_posts,
        SUM(views) as total_views,
        SUM(leads) as total_leads,
        SUM(conversions) as total_conversions,
        AVG(risk_score) as avg_risk_score
      FROM posts WHERE district = ?`
    ).get(regionName)
  } else if (level === 2) {
    postStats = db.prepare(
      `SELECT COUNT(*) as total_posts,
        SUM(views) as total_views,
        SUM(leads) as total_leads,
        SUM(conversions) as total_conversions,
        AVG(risk_score) as avg_risk_score
      FROM posts WHERE city = ?`
    ).get(regionName)
  } else {
    postStats = db.prepare(
      `SELECT COUNT(*) as total_posts,
        SUM(views) as total_views,
        SUM(leads) as total_leads,
        SUM(conversions) as total_conversions,
        AVG(risk_score) as avg_risk_score
      FROM posts WHERE province = ?`
    ).get(regionName)
  }

  const children = db.prepare('SELECT * FROM geo_regions WHERE parent_code = ? ORDER BY code').all(code as string)

  res.json({
    success: true,
    data: {
      region,
      stats: postStats,
      children,
    },
  })
})

export default router
