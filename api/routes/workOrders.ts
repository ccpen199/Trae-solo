import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function findAvailableWorker(area: string): { id: string; name: string } | null {
  const stmt = db.prepare(`
    SELECT id, name FROM grid_workers 
    WHERE area = ? AND status IN ('idle', 'on_duty')
    ORDER BY active_orders ASC, status ASC
    LIMIT 1
  `)
  const worker = stmt.get(area) as { id: string; name: string } | undefined
  return worker || null
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string
    const type = req.query.type as string
    const priority = req.query.priority as string
    const assignee = req.query.assignee as string
    const gridArea = req.query.gridArea as string

    const offset = (page - 1) * pageSize

    const whereClauses: string[] = []
    const params: Record<string, unknown> = {}

    if (status) {
      whereClauses.push('w.status = @status')
      params.status = status
    }
    if (type) {
      whereClauses.push('w.type = @type')
      params.type = type
    }
    if (priority) {
      whereClauses.push('w.priority = @priority')
      params.priority = priority
    }
    if (assignee) {
      whereClauses.push('w.assignee = @assignee')
      params.assignee = assignee
    }
    if (gridArea) {
      whereClauses.push('w.grid_area = @gridArea')
      params.gridArea = gridArea
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM work_orders w ${whereClause}`)
    const { total } = countStmt.get(params) as { total: number }

    const listStmt = db.prepare(`
      SELECT w.*, u.name as user_name, u.account_no, u.address
      FROM work_orders w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereClause}
      ORDER BY w.created_at DESC
      LIMIT @limit OFFSET @offset
    `)
    const orders = listStmt.all({ ...params, limit: pageSize, offset }).map((item: { images: string; evaluation: string | null }) => ({
      ...item,
      images: JSON.parse(item.images),
      evaluation: item.evaluation ? JSON.parse(item.evaluation) : null,
    }))

    res.json({
      success: true,
      data: {
        list: orders,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取工单列表失败',
    })
  }
})

router.get('/statistics', (req: Request, res: Response): void => {
  try {
    const statusStmt = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM work_orders 
      GROUP BY status
    `)
    const statusStats = statusStmt.all() as Array<{ status: string; count: number }>

    const priorityStmt = db.prepare(`
      SELECT priority, COUNT(*) as count 
      FROM work_orders 
      GROUP BY priority
    `)
    const priorityStats = priorityStmt.all() as Array<{ priority: string; count: number }>

    const typeStmt = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM work_orders 
      GROUP BY type
    `)
    const typeStats = typeStmt.all() as Array<{ type: string; count: number }>

    const todayStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM work_orders 
      WHERE DATE(created_at) = DATE('now', 'localtime')
    `)
    const { count: todayCount } = todayStmt.get() as { count: number }

    const completedStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM work_orders 
      WHERE status IN ('completed', 'closed')
    `)
    const { count: completedCount } = completedStmt.get() as { count: number }

    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM work_orders')
    const { count: totalCount } = totalStmt.get() as { count: number }

    res.json({
      success: true,
      data: {
        total: totalCount,
        today: todayCount,
        completed: completedCount,
        completion_rate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) / 100 : 0,
        by_status: statusStats,
        by_priority: priorityStats,
        by_type: typeStats,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取工单统计失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const stmt = db.prepare(`
      SELECT w.*, u.name as user_name, u.account_no, u.address, u.phone
      FROM work_orders w
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `)
    const order = stmt.get(id)

    if (!order) {
      res.status(404).json({
        success: false,
        error: '工单不存在',
      })
      return
    }

    const orderWithDetails = {
      ...(order as Record<string, unknown>),
      images: JSON.parse((order as { images: string }).images),
      evaluation: (order as { evaluation: string | null }).evaluation
        ? JSON.parse((order as { evaluation: string }).evaluation)
        : null,
    }

    res.json({
      success: true,
      data: orderWithDetails,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取工单详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { user_id, type, title, description, priority, warning_id } = req.body

    if (!user_id || !type || !title || !description) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      })
      return
    }

    const userStmt = db.prepare('SELECT area FROM users WHERE id = ?')
    const user = userStmt.get(user_id) as { area: string } | undefined

    if (!user) {
      res.status(400).json({
        success: false,
        error: '用户不存在',
      })
      return
    }

    const gridArea = user.area || ''
    const worker = findAvailableWorker(gridArea)

    const id = generateId('order')
    const now = new Date().toISOString().replace('T', ' ').split('.')[0]

    const insertStmt = db.prepare(`
      INSERT INTO work_orders (id, user_id, type, title, description, priority, status, assignee, grid_area, created_at, dispatched_at, images, evaluation, warning_id)
      VALUES (@id, @user_id, @type, @title, @description, @priority, @status, @assignee, @grid_area, @created_at, @dispatched_at, '[]', NULL, @warning_id)
    `)
    insertStmt.run({
      id,
      user_id,
      type,
      title,
      description,
      priority: priority || 'medium',
      status: worker ? 'dispatched' : 'pending',
      assignee: worker ? worker.name : null,
      grid_area: gridArea,
      created_at: now,
      dispatched_at: worker ? now : null,
      warning_id: warning_id || null,
    })

    if (worker) {
      const updateWorkerStmt = db.prepare(`
        UPDATE grid_workers SET status = 'on_task', active_orders = active_orders + 1
        WHERE id = ?
      `)
      updateWorkerStmt.run(worker.id)
    }

    const orderStmt = db.prepare('SELECT * FROM work_orders WHERE id = ?')
    const order = orderStmt.get(id)

    res.json({
      success: true,
      data: {
        ...(order as Record<string, unknown>),
        images: JSON.parse((order as { images: string }).images),
        auto_dispatched: !!worker,
        assignee_info: worker,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建工单失败',
    })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { status, description, priority, assignee, completed_at } = req.body

    const checkStmt = db.prepare('SELECT * FROM work_orders WHERE id = ?')
    const existing = checkStmt.get(id)

    if (!existing) {
      res.status(404).json({
        success: false,
        error: '工单不存在',
      })
      return
    }

    const updates: string[] = []
    const params: Record<string, unknown> = { id }

    if (status !== undefined) {
      updates.push('status = @status')
      params.status = status
    }
    if (description !== undefined) {
      updates.push('description = @description')
      params.description = description
    }
    if (priority !== undefined) {
      updates.push('priority = @priority')
      params.priority = priority
    }
    if (assignee !== undefined) {
      updates.push('assignee = @assignee')
      params.assignee = assignee
    }
    if (completed_at !== undefined) {
      updates.push('completed_at = @completed_at')
      params.completed_at = completed_at
    }

    if (status === 'dispatched' && !(existing as { dispatched_at: string | null }).dispatched_at) {
      updates.push('dispatched_at = @dispatched_at')
      params.dispatched_at = new Date().toISOString().replace('T', ' ').split('.')[0]
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: '没有需要更新的字段',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE work_orders SET ${updates.join(', ')} WHERE id = @id
    `)
    updateStmt.run(params)

    const order = checkStmt.get(id)

    res.json({
      success: true,
      data: {
        ...(order as Record<string, unknown>),
        images: JSON.parse((order as { images: string }).images),
        evaluation: (order as { evaluation: string | null }).evaluation
          ? JSON.parse((order as { evaluation: string }).evaluation)
          : null,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新工单失败',
    })
  }
})

router.post('/:id/evaluate', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { rating, comment } = req.body

    if (rating === undefined) {
      res.status(400).json({
        success: false,
        error: '缺少评分',
      })
      return
    }

    const checkStmt = db.prepare('SELECT * FROM work_orders WHERE id = ?')
    const existing = checkStmt.get(id)

    if (!existing) {
      res.status(404).json({
        success: false,
        error: '工单不存在',
      })
      return
    }

    const evaluation = JSON.stringify({
      rating,
      comment: comment || '',
      evaluatedAt: new Date().toISOString().replace('T', ' ').split('.')[0],
    })

    const updateStmt = db.prepare('UPDATE work_orders SET evaluation = ? WHERE id = ?')
    updateStmt.run(evaluation, id)

    const order = checkStmt.get(id)

    res.json({
      success: true,
      data: {
        ...(order as Record<string, unknown>),
        images: JSON.parse((order as { images: string }).images),
        evaluation: JSON.parse((order as { evaluation: string }).evaluation),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '提交评价失败',
    })
  }
})

export default router
