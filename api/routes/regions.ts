import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { parent_code } = req.query

    let rows: any[]

    if (parent_code) {
      rows = db.prepare('SELECT * FROM regions WHERE parent_code = ? ORDER BY sort_order').all(parent_code)
    } else {
      rows = db.prepare("SELECT * FROM regions WHERE level = 1 ORDER BY sort_order").all()
    }

    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取地区列表失败' })
  }
})

router.get('/tree', async (_req: Request, res: Response): Promise<void> => {
  try {
    const allRegions = db.prepare('SELECT * FROM regions ORDER BY level, sort_order').all() as any[]

    const map = new Map<string, any>()
    const roots: any[] = []

    for (const region of allRegions) {
      map.set(region.code, { ...region, children: [] })
    }

    for (const region of allRegions) {
      const node = map.get(region.code)!
      if (region.parent_code && map.has(region.parent_code)) {
        map.get(region.parent_code)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    res.json({ success: true, data: roots })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取地区树失败' })
  }
})

router.get('/heat-map', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = db.prepare(`
      SELECT r.code as region_code, r.name as region_name,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT o.id) as order_count
      FROM regions r
      LEFT JOIN users u ON u.region_code = r.code
      LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY r.code
      ORDER BY r.sort_order
    `).all()

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取地区热力图数据失败' })
  }
})

router.get('/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const row = db.prepare('SELECT * FROM regions WHERE code = ?').get(req.params.code)

    if (!row) {
      res.status(404).json({ success: false, error: '地区不存在' })
      return
    }

    res.json({ success: true, data: row })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取地区信息失败' })
  }
})

export default router
