import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string
    const area = req.query.area as string

    const offset = (page - 1) * pageSize

    const whereClauses: string[] = []
    const params: Record<string, unknown> = {}

    if (status) {
      whereClauses.push('status = @status')
      params.status = status
    }
    if (area) {
      whereClauses.push('area = @area')
      params.area = area
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM outage_plans ${whereClause}`)
    const { total } = countStmt.get(params) as { total: number }

    const listStmt = db.prepare(`
      SELECT * FROM outage_plans
      ${whereClause}
      ORDER BY start_time DESC
      LIMIT @limit OFFSET @offset
    `)
    const plans = listStmt.all({ ...params, limit: pageSize, offset }).map((item: { affected_account_nos: string }) => ({
      ...item,
      affected_account_nos: JSON.parse(item.affected_account_nos),
    }))

    res.json({
      success: true,
      data: {
        list: plans,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取停气计划失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const stmt = db.prepare('SELECT * FROM outage_plans WHERE id = ?')
    const plan = stmt.get(id)

    if (!plan) {
      res.status(404).json({
        success: false,
        error: '停气计划不存在',
      })
      return
    }

    const planWithDetails = {
      ...(plan as Record<string, unknown>),
      affected_account_nos: JSON.parse((plan as { affected_account_nos: string }).affected_account_nos),
    }

    res.json({
      success: true,
      data: planWithDetails,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取停气计划详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { title, area, start_time, end_time, reason, affected_users, affected_account_nos, created_by } = req.body

    if (!title || !area || !start_time || !end_time) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      })
      return
    }

    const id = generateId('outage')
    const now = new Date().toISOString().replace('T', ' ').split('.')[0]

    const insertStmt = db.prepare(`
      INSERT INTO outage_plans (id, title, area, start_time, end_time, reason, affected_users, affected_account_nos, status, created_at, created_by)
      VALUES (@id, @title, @area, @start_time, @end_time, @reason, @affected_users, @affected_account_nos, 'draft', @created_at, @created_by)
    `)
    insertStmt.run({
      id,
      title,
      area,
      start_time,
      end_time,
      reason: reason || null,
      affected_users: affected_users || 0,
      affected_account_nos: JSON.stringify(affected_account_nos || []),
      created_at: now,
      created_by: created_by || null,
    })

    const stmt = db.prepare('SELECT * FROM outage_plans WHERE id = ?')
    const plan = stmt.get(id)

    res.json({
      success: true,
      data: {
        ...(plan as Record<string, unknown>),
        affected_account_nos: JSON.parse((plan as { affected_account_nos: string }).affected_account_nos),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建停气计划失败',
    })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { title, area, start_time, end_time, reason, affected_users, affected_account_nos, status } = req.body

    const checkStmt = db.prepare('SELECT id FROM outage_plans WHERE id = ?')
    const existing = checkStmt.get(id)

    if (!existing) {
      res.status(404).json({
        success: false,
        error: '停气计划不存在',
      })
      return
    }

    const updates: string[] = []
    const params: Record<string, unknown> = { id }

    if (title !== undefined) {
      updates.push('title = @title')
      params.title = title
    }
    if (area !== undefined) {
      updates.push('area = @area')
      params.area = area
    }
    if (start_time !== undefined) {
      updates.push('start_time = @start_time')
      params.start_time = start_time
    }
    if (end_time !== undefined) {
      updates.push('end_time = @end_time')
      params.end_time = end_time
    }
    if (reason !== undefined) {
      updates.push('reason = @reason')
      params.reason = reason
    }
    if (affected_users !== undefined) {
      updates.push('affected_users = @affected_users')
      params.affected_users = affected_users
    }
    if (affected_account_nos !== undefined) {
      updates.push('affected_account_nos = @affected_account_nos')
      params.affected_account_nos = JSON.stringify(affected_account_nos)
    }
    if (status !== undefined) {
      updates.push('status = @status')
      params.status = status
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: '没有需要更新的字段',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE outage_plans SET ${updates.join(', ')} WHERE id = @id
    `)
    updateStmt.run(params)

    const stmt = db.prepare('SELECT * FROM outage_plans WHERE id = ?')
    const plan = stmt.get(id)

    res.json({
      success: true,
      data: {
        ...(plan as Record<string, unknown>),
        affected_account_nos: JSON.parse((plan as { affected_account_nos: string }).affected_account_nos),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新停气计划失败',
    })
  }
})

router.post('/:id/simulate', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const stmt = db.prepare('SELECT * FROM outage_plans WHERE id = ?')
    const plan = stmt.get(id)

    if (!plan) {
      res.status(404).json({
        success: false,
        error: '停气计划不存在',
      })
      return
    }

    const area = (plan as { area: string }).area

    const userStmt = db.prepare('SELECT * FROM users WHERE area = ? AND status = ?')
    const affectedUsers = userStmt.all(area, 'active') as Array<{ id: string; account_no: string; name: string; address: string }>

    const affectedCount = affectedUsers.length
    const accountNos = affectedUsers.map(u => u.account_no)

    const centerLng = 116.3 + Math.random() * 0.3
    const centerLat = 39.85 + Math.random() * 0.2

    const mapPolygon: Array<{ lng: number; lat: number }> = []
    const numPoints = 12
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI
      const radius = 0.02 + Math.random() * 0.01
      mapPolygon.push({
        lng: centerLng + Math.cos(angle) * radius,
        lat: centerLat + Math.sin(angle) * radius,
      })
    }

    res.json({
      success: true,
      data: {
        outage_id: id,
        affected_users: affectedCount,
        affected_account_nos: accountNos.slice(0, 100),
        area,
        map_center: { lng: centerLng, lat: centerLat },
        map_polygon: mapPolygon,
        estimated_restore_hours: 4 + Math.floor(Math.random() * 4),
        simulation_time: new Date().toISOString(),
        mock: true,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '模拟影响范围失败',
    })
  }
})

router.post('/:id/publish', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const checkStmt = db.prepare('SELECT * FROM outage_plans WHERE id = ?')
    const existing = checkStmt.get(id)

    if (!existing) {
      res.status(404).json({
        success: false,
        error: '停气计划不存在',
      })
      return
    }

    if ((existing as { status: string }).status !== 'draft') {
      res.status(400).json({
        success: false,
        error: '只有草稿状态可发布',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE outage_plans SET status = 'published' WHERE id = ?
    `)
    updateStmt.run(id)

    const stmt = db.prepare('SELECT * FROM outage_plans WHERE id = ?')
    const plan = stmt.get(id)

    res.json({
      success: true,
      data: {
        ...(plan as Record<string, unknown>),
        affected_account_nos: JSON.parse((plan as { affected_account_nos: string }).affected_account_nos),
        published: true,
        notified_users: (plan as { affected_users: number }).affected_users,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '发布停气计划失败',
    })
  }
})

export default router
