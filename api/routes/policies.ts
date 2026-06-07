import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { level, industry, scale, region } = req.query
    let sql = 'SELECT * FROM policies WHERE 1=1'
    const params: any[] = []
    if (level) {
      sql += ' AND level = ?'
      params.push(level)
    }
    if (industry) {
      sql += ' AND industry_tags LIKE ?'
      params.push(`%${industry}%`)
    }
    if (scale) {
      sql += ' AND scale_tags LIKE ?'
      params.push(`%${scale}%`)
    }
    if (region) {
      sql += ' AND region_tags LIKE ?'
      params.push(`%${region}%`)
    }
    sql += ' ORDER BY publish_date DESC'
    const policies = db.prepare(sql).all(...params)
    res.json({ success: true, data: policies })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取政策列表失败' })
  }
})

router.get('/recommend', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const taxpayers = db.prepare('SELECT * FROM taxpayers WHERE user_id = ?').all(req.user!.id) as any[]
    let recommendations: any[] = []
    for (const tp of taxpayers) {
      const policies = db.prepare(
        `SELECT * FROM policies WHERE
          (industry_tags LIKE ? OR scale_tags LIKE ? OR region_tags LIKE ?)
          AND publish_date >= date('now', '-1 year')
          ORDER BY publish_date DESC`
      ).all(
        `%${tp.industry || ''}%`,
        `%${tp.scale || ''}%`,
        `%${tp.region || ''}%`
      ) as any[]
      for (const p of policies) {
        if (!recommendations.find(r => r.id === p.id)) {
          recommendations.push({ ...p, match_reason: `匹配您的纳税人主体：${tp.name}（${tp.industry}/${tp.scale}/${tp.region}）` })
        }
      }
    }
    if (recommendations.length === 0) {
      recommendations = db.prepare('SELECT * FROM policies ORDER BY publish_date DESC LIMIT 5').all() as any[]
      recommendations = recommendations.map(p => ({ ...p, match_reason: '热门政策推荐' }))
    }
    res.json({ success: true, data: recommendations })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取推荐政策失败' })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id) as any
    if (!policy) {
      res.status(404).json({ success: false, error: '政策不存在' })
      return
    }
    if (typeof policy.industry_tags === 'string') {
      try { policy.industry_tags = JSON.parse(policy.industry_tags) } catch {}
    }
    if (typeof policy.scale_tags === 'string') {
      try { policy.scale_tags = JSON.parse(policy.scale_tags) } catch {}
    }
    if (typeof policy.region_tags === 'string') {
      try { policy.region_tags = JSON.parse(policy.region_tags) } catch {}
    }
    res.json({ success: true, data: policy })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取政策详情失败' })
  }
})

export default router
