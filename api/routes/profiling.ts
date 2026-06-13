import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/users', (req: Request, res: Response): void => {
  const { cluster, frequency, page = '1', pageSize = '10' } = req.query
  const pageNum = parseInt(page as string)
  const pageSizeNum = parseInt(pageSize as string)
  const offset = (pageNum - 1) * pageSizeNum

  let whereClauses: string[] = []
  let params: any[] = []

  if (cluster) {
    whereClauses.push('cluster = ?')
    params.push(cluster)
  }
  if (frequency) {
    whereClauses.push('frequency = ?')
    params.push(frequency)
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM user_profiles ${whereSql}`)
  const total = totalStmt.get(...params) as { count: number }

  const stmt = db.prepare(`
    SELECT up.*, u.name, u.phone
    FROM user_profiles up
    LEFT JOIN users u ON up.user_id = u.id
    ${whereSql}
    ORDER BY up.total_orders DESC
    LIMIT ? OFFSET ?
  `)
  const profiles = stmt.all(...params, pageSizeNum, offset)

  const parsed = profiles.map((p: any) => ({
    ...p,
    regions: JSON.parse(p.regions),
    categories: JSON.parse(p.categories),
  }))

  res.json({
    success: true,
    data: {
      list: parsed,
      total: total.count,
      page: pageNum,
      pageSize: pageSizeNum,
    },
  })
})

router.get('/users/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params

  const stmt = db.prepare(`
    SELECT up.*, u.name, u.phone, u.role
    FROM user_profiles up
    LEFT JOIN users u ON up.user_id = u.id
    WHERE up.user_id = ?
  `)
  const profile = stmt.get(userId) as any

  if (!profile) {
    res.status(404).json({ success: false, error: '用户画像不存在' })
    return
  }

  const ordersStmt = db.prepare('SELECT COUNT(*) as order_count, COALESCE(SUM(fee), 0) as total_spent FROM orders WHERE user_id = ?')
  const orderStats = ordersStmt.get(userId) as any

  const couponsStmt = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN used = 0 THEN 1 ELSE 0 END) as unused FROM coupons WHERE user_id = ?')
  const couponStats = couponsStmt.get(userId) as any

  res.json({
    success: true,
    data: {
      ...profile,
      regions: JSON.parse(profile.regions),
      categories: JSON.parse(profile.categories),
      order_stats: orderStats,
      coupon_stats: couponStats,
    },
  })
})

router.get('/clusters', (req: Request, res: Response): void => {
  const clusters = db.prepare(`
    SELECT cluster as name, COUNT(*) as user_count, AVG(total_orders) as avg_orders, AVG(coupon_usage_rate) as avg_coupon_rate
    FROM user_profiles
    GROUP BY cluster
    ORDER BY user_count DESC
  `).all()

  res.json({
    success: true,
    data: clusters,
  })
})

router.get('/statistics/overview', (req: Request, res: Response): void => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM user_profiles').get() as { count: number }

  const totalOrders = db.prepare('SELECT COALESCE(SUM(total_orders), 0) as total FROM user_profiles').get() as { total: number }

  const avgCouponRate = db.prepare('SELECT AVG(coupon_usage_rate) as avg FROM user_profiles').get() as { avg: number }

  const highValueUsers = db.prepare("SELECT COUNT(*) as count FROM user_profiles WHERE cluster = '高频用户'").get() as { count: number }

  const categoryStats = db.prepare(`
    SELECT value as category, COUNT(*) as count
    FROM user_profiles, json_each(categories)
    GROUP BY value
    ORDER BY count DESC
    LIMIT 10
  `).all()

  const regionStats = db.prepare(`
    SELECT value as region, COUNT(*) as count
    FROM user_profiles, json_each(regions)
    GROUP BY value
    ORDER BY count DESC
    LIMIT 10
  `).all()

  res.json({
    success: true,
    data: {
      total_users: totalUsers.count,
      total_orders: totalOrders.total,
      avg_coupon_usage_rate: Math.round((avgCouponRate.avg || 0) * 100) / 100,
      high_value_users: highValueUsers.count,
      top_categories: categoryStats,
      top_regions: regionStats,
    },
  })
})

router.get('/coupons', (req: Request, res: Response): void => {
  const { user_id } = req.query
  if (!user_id) {
    res.status(400).json({ success: false, error: '用户ID不能为空' })
    return
  }
  const coupons = db.prepare('SELECT * FROM coupons WHERE user_id = ? ORDER BY expires_at ASC').all(user_id)
  res.json({ success: true, data: coupons })
})

router.get('/coupons/recommend', (req: Request, res: Response): void => {
  const { user_id } = req.query

  if (!user_id) {
    res.status(400).json({ success: false, error: '用户ID不能为空' })
    return
  }

  const profileStmt = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?')
  const profile = profileStmt.get(user_id as string) as any

  if (!profile) {
    res.status(404).json({ success: false, error: '用户画像不存在' })
    return
  }

  const coupons = db.prepare(`
    SELECT * FROM coupons
    WHERE (target_cluster = ? OR target_cluster IS NULL)
      AND used = 0
      AND (user_id IS NULL OR user_id = ?)
      AND expires_at > date('now')
    ORDER BY amount DESC
    LIMIT 10
  `).all(profile.cluster, user_id)

  res.json({
    success: true,
    data: {
      user_cluster: profile.cluster,
      coupons,
    },
  })
})

router.get('/segments', (req: Request, res: Response): void => {
  const segments = [
    {
      id: 'high_value',
      name: '高价值用户',
      description: '月消费频次高、客单价高的用户',
      criteria: 'total_orders > 20 AND coupon_usage_rate > 0.5',
      user_count: 0,
    },
    {
      id: 'price_sensitive',
      name: '价格敏感型',
      description: '对优惠券响应高、偏好经济件的用户',
      criteria: 'coupon_usage_rate > 0.7',
      user_count: 0,
    },
    {
      id: 'occasional',
      name: '偶发用户',
      description: '使用频率低、需要激活的用户',
      criteria: "frequency = 'low' AND total_orders < 5",
      user_count: 0,
    },
    {
      id: 'heavy_shipper',
      name: '重货用户',
      description: '平均重量大、物流费用高的用户',
      criteria: 'avg_weight > 3',
      user_count: 0,
    },
  ]

  for (const seg of segments) {
    const result = db.prepare(`SELECT COUNT(*) as count FROM user_profiles WHERE ${seg.criteria}`).get() as { count: number }
    seg.user_count = result.count
  }

  res.json({
    success: true,
    data: segments,
  })
})

export default router
