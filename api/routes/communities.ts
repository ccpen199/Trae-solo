import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { district, school_district, keyword, page = '1', pageSize = '20' } = req.query
  const p = Number(page)
  const ps = Number(pageSize)
  const offset = (p - 1) * ps

  let where = 'WHERE 1=1'
  const params: any[] = []
  if (district) {
    where += ' AND c.district = ?'
    params.push(district)
  }
  if (school_district) {
    where += ' AND c.school_district = ?'
    params.push(school_district)
  }
  if (keyword) {
    where += ' AND (c.name LIKE ? OR c.school_district LIKE ? OR c.address LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM communities c ${where}`).get(...params) as any).cnt
  const rows = db.prepare(
    `SELECT c.*, 
      (SELECT cs.viewings_30d FROM community_stats cs WHERE cs.community_id = c.id ORDER BY cs.stat_date DESC LIMIT 1) as latest_viewings_30d,
      (SELECT cs.rent_change_pct FROM community_stats cs WHERE cs.community_id = c.id ORDER BY cs.stat_date DESC LIMIT 1) as latest_rent_change_pct,
      (SELECT cs.price_change_pct FROM community_stats cs WHERE cs.community_id = c.id ORDER BY cs.stat_date DESC LIMIT 1) as latest_price_change_pct,
      (SELECT cs.avg_transaction_cycle_days FROM community_stats cs WHERE cs.community_id = c.id ORDER BY cs.stat_date DESC LIMIT 1) as latest_avg_cycle_days
    FROM communities c ${where} ORDER BY c.id DESC LIMIT ? OFFSET ?`
  ).all(...params, ps, offset)

  res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
})

router.get('/districts', (req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT DISTINCT district FROM communities ORDER BY district').all()
  res.json({ success: true, data: rows.map((r: any) => r.district) })
})

router.get('/schools', (req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT DISTINCT school_district FROM communities WHERE school_district IS NOT NULL AND school_district != \'\' ORDER BY school_district').all()
  res.json({ success: true, data: rows.map((r: any) => r.school_district) })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!community) {
    res.status(404).json({ success: false, error: '小区不存在' })
    return
  }
  const stats = db.prepare(
    'SELECT * FROM community_stats WHERE community_id = ? ORDER BY stat_date DESC LIMIT 30'
  ).all(req.params.id)
  const propertyCount = (db.prepare(
    'SELECT type, COUNT(*) as cnt FROM properties WHERE community_id = ? AND status = \'active\' GROUP BY type'
  ).all(req.params.id) as any[])

  res.json({ success: true, data: { ...community, stats, propertyCount } })
})

router.get('/:id/stats', (req: Request, res: Response): void => {
  const db = getDb()
  const stats = db.prepare(
    'SELECT * FROM community_stats WHERE community_id = ? ORDER BY stat_date DESC LIMIT 30'
  ).all(req.params.id)
  res.json({ success: true, data: stats })
})

export default router
