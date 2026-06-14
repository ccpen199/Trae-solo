import { Router, Request, Response } from 'express'
import { success, notFound, badRequest } from '../utils/response'
import { runQuery, runQueryOne, runInsert, runUpdate } from '../utils/db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { category, page = '1', pageSize = '100' } = req.query
  const p = parseInt(page as string)
  const ps = parseInt(pageSize as string)
  const offset = (p - 1) * ps

  let sql = 'SELECT * FROM trades WHERE 1=1'
  const params: any[] = []

  if (category) {
    sql += ' AND category = ?'
    params.push(category)
  }

  sql += ' ORDER BY id ASC LIMIT ? OFFSET ?'
  params.push(ps, offset)

  const list = runQuery(sql, params)
  const countResult = runQueryOne('SELECT COUNT(*) as count FROM trades WHERE 1=1' + (category ? ' AND category = ?' : ''), category ? [category] : [])

  const listWithTradeIds = list.map(item => ({
    ...item,
    trade_ids: typeof item.trade_ids === 'string' ? JSON.parse(item.trade_ids) : item.trade_ids
  }))

  success(res, {
    list: listWithTradeIds,
    total: countResult?.count || 0,
    page: p,
    pageSize: ps
  })
})

router.get('/stats', (req: Request, res: Response) => {
  const stats = runQuery(`
    SELECT 
      t.id,
      t.name,
      t.category,
      COUNT(DISTINCT w.id) as worker_count,
      COUNT(DISTINCT j.id) as job_count,
      COALESCE(AVG(j.daily_wage), 0) as avg_wage
    FROM trades t
    LEFT JOIN workers w ON (',' || replace(replace(w.trade_ids, '[', ''), ']', '') || ',' LIKE '%,' || t.id || ',%')
    LEFT JOIN job_requirements j ON j.trade_id = t.id AND j.status = 'published'
    GROUP BY t.id, t.name, t.category
    ORDER BY worker_count DESC
  `)
  success(res, stats)
})

router.get('/categories', (req: Request, res: Response) => {
  const categories = runQuery('SELECT DISTINCT category FROM trades ORDER BY category')
  success(res, categories.map(c => c.category))
})

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const tradeId = parseInt(id)

  const trade = runQueryOne(`
    SELECT 
      t.*,
      COUNT(DISTINCT w.id) as worker_count,
      COUNT(DISTINCT j.id) as job_count
    FROM trades t
    LEFT JOIN workers w ON (',' || replace(replace(w.trade_ids, '[', ''), ']', '') || ',' LIKE '%,' || t.id || ',%')
    LEFT JOIN job_requirements j ON j.trade_id = t.id
    WHERE t.id = ?
    GROUP BY t.id
  `, [tradeId])

  if (!trade) {
    return notFound(res, '工种不存在')
  }

  const workers = runQuery(`
    SELECT 
      w.id,
      w.name,
      w.phone,
      w.health_status,
      w.performance_score,
      (SELECT COUNT(*) FROM skill_certificates sc WHERE sc.worker_id = w.id) as certificate_count
    FROM workers w
    WHERE ',' || replace(replace(w.trade_ids, '[', ''), ']', '') || ',' LIKE '%,' || ? || ',%'
    ORDER BY w.performance_score DESC
    LIMIT 50
  `, [tradeId])

  const jobRequirements = runQuery(`
    SELECT 
      j.id,
      j.project_name,
      j.quantity,
      j.daily_wage,
      j.status,
      j.start_date,
      j.end_date
    FROM job_requirements j
    WHERE j.trade_id = ?
    ORDER BY j.created_at DESC
    LIMIT 50
  `, [tradeId])

  const wageTrend = runQuery(`
    SELECT 
      strftime('%Y-%m', c.created_at) as month,
      COALESCE(AVG(c.daily_wage), 0) as avg_wage
    FROM contracts c
    INNER JOIN job_requirements j ON c.job_id = j.id
    WHERE j.trade_id = ? AND c.created_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', c.created_at)
    ORDER BY month ASC
  `, [tradeId])

  const now = new Date()
  const months: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const trendMap = new Map(wageTrend.map((w: any) => [w.month, w.avg_wage]))
  const fullWageTrend = months.map(month => ({
    month,
    avg_wage: trendMap.get(month) || 0
  }))

  success(res, {
    ...trade,
    workers,
    job_requirements: jobRequirements,
    wage_trend: fullWageTrend
  })
})

router.get('/:id/workers', (req: Request, res: Response) => {
  const { id } = req.params
  const { page = '1', pageSize = '20' } = req.query
  const p = parseInt(page as string)
  const ps = parseInt(pageSize as string)
  const offset = (p - 1) * ps
  const tradeId = parseInt(id)

  const workers = runQuery(`
    SELECT 
      w.id,
      w.name,
      w.phone,
      w.health_status,
      w.performance_score,
      (SELECT COUNT(*) FROM skill_certificates sc WHERE sc.worker_id = w.id) as certificate_count
    FROM workers w
    WHERE ',' || replace(replace(w.trade_ids, '[', ''), ']', '') || ',' LIKE '%,' || ? || ',%'
    ORDER BY w.performance_score DESC
    LIMIT ? OFFSET ?
  `, [tradeId, ps, offset])

  const countResult = runQueryOne(`
    SELECT COUNT(*) as count 
    FROM workers w
    WHERE ',' || replace(replace(w.trade_ids, '[', ''), ']', '') || ',' LIKE '%,' || ? || ',%'
  `, [tradeId])

  success(res, {
    list: workers,
    total: countResult?.count || 0,
    page: p,
    pageSize: ps
  })
})

router.get('/:id/jobs', (req: Request, res: Response) => {
  const { id } = req.params
  const { page = '1', pageSize = '20' } = req.query
  const p = parseInt(page as string)
  const ps = parseInt(pageSize as string)
  const offset = (p - 1) * ps
  const tradeId = parseInt(id)

  const jobs = runQuery(`
    SELECT 
      j.id,
      j.project_name,
      j.quantity,
      j.daily_wage,
      j.status,
      j.start_date,
      j.end_date
    FROM job_requirements j
    WHERE j.trade_id = ?
    ORDER BY j.created_at DESC
    LIMIT ? OFFSET ?
  `, [tradeId, ps, offset])

  const countResult = runQueryOne(`
    SELECT COUNT(*) as count 
    FROM job_requirements j
    WHERE j.trade_id = ?
  `, [tradeId])

  success(res, {
    list: jobs,
    total: countResult?.count || 0,
    page: p,
    pageSize: ps
  })
})

router.post('/', (req: Request, res: Response) => {
  const { name, category, description, skillLevel } = req.body
  if (!name || !category) {
    return badRequest(res, '缺少必要参数')
  }

  const existing = runQueryOne('SELECT id FROM trades WHERE name = ?', [name])
  if (existing) {
    return badRequest(res, '工种名称已存在')
  }

  const id = runInsert(
    'INSERT INTO trades (name, category, description, skill_level) VALUES (?, ?, ?, ?)',
    [name, category, description || '', skillLevel || 1]
  )

  success(res, { id, name, category, description, skillLevel })
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const { name, category, description, skillLevel } = req.body

  const existing = runQueryOne('SELECT id FROM trades WHERE id = ?', [parseInt(id)])
  if (!existing) {
    return notFound(res, '工种不存在')
  }

  runUpdate(
    'UPDATE trades SET name = ?, category = ?, description = ?, skill_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, category, description || '', skillLevel || 1, parseInt(id)]
  )

  success(res, { id: parseInt(id), name, category, description, skillLevel })
})

export default router
