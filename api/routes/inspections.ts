import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

router.get('/plans', (req: Request, res: Response): void => {
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

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM inspection_plans ${whereClause}`)
    const { total } = countStmt.get(params) as { total: number }

    const listStmt = db.prepare(`
      SELECT * FROM inspection_plans
      ${whereClause}
      ORDER BY start_date DESC
      LIMIT @limit OFFSET @offset
    `)
    const plans = listStmt.all({ ...params, limit: pageSize, offset }).map((item: { assignees: string }) => ({
      ...item,
      assignees: JSON.parse(item.assignees),
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
      error: error instanceof Error ? error.message : '获取巡检计划失败',
    })
  }
})

router.post('/plans', (req: Request, res: Response): void => {
  try {
    const { title, area, start_date, end_date, assignees, total_tasks } = req.body

    if (!title || !area || !start_date || !end_date) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      })
      return
    }

    const id = generateId('plan')

    const insertStmt = db.prepare(`
      INSERT INTO inspection_plans (id, title, area, start_date, end_date, assignees, status, total_tasks, completed_tasks)
      VALUES (@id, @title, @area, @start_date, @end_date, @assignees, 'planned', @total_tasks, 0)
    `)
    insertStmt.run({
      id,
      title,
      area,
      start_date,
      end_date,
      assignees: JSON.stringify(assignees || []),
      total_tasks: total_tasks || 0,
    })

    const stmt = db.prepare('SELECT * FROM inspection_plans WHERE id = ?')
    const plan = stmt.get(id)

    res.json({
      success: true,
      data: {
        ...(plan as Record<string, unknown>),
        assignees: JSON.parse((plan as { assignees: string }).assignees),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建巡检计划失败',
    })
  }
})

router.get('/records', (req: Request, res: Response): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const planId = req.query.planId as string
    const userId = req.query.userId as string
    const result = req.query.result as string
    const inspector = req.query.inspector as string

    const offset = (page - 1) * pageSize

    const whereClauses: string[] = []
    const params: Record<string, unknown> = {}

    if (planId) {
      whereClauses.push('ir.plan_id = @planId')
      params.planId = planId
    }
    if (userId) {
      whereClauses.push('ir.user_id = @userId')
      params.userId = userId
    }
    if (result) {
      whereClauses.push('ir.result = @result')
      params.result = result
    }
    if (inspector) {
      whereClauses.push('ir.inspector = @inspector')
      params.inspector = inspector
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM inspection_records ir ${whereClause}`)
    const { total } = countStmt.get(params) as { total: number }

    const listStmt = db.prepare(`
      SELECT ir.*, u.name as user_name, u.account_no, u.address, ip.title as plan_title
      FROM inspection_records ir
      LEFT JOIN users u ON ir.user_id = u.id
      LEFT JOIN inspection_plans ip ON ir.plan_id = ip.id
      ${whereClause}
      ORDER BY ir.inspect_date DESC
      LIMIT @limit OFFSET @offset
    `)
    const records = listStmt.all({ ...params, limit: pageSize, offset }).map((item: { images: string }) => ({
      ...item,
      images: JSON.parse(item.images),
    }))

    res.json({
      success: true,
      data: {
        list: records,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取巡检记录失败',
    })
  }
})

router.post('/records', (req: Request, res: Response): void => {
  try {
    const { plan_id, user_id, inspector, inspect_date, result, notes, images } = req.body

    if (!plan_id || !user_id || !inspector || !inspect_date || !result) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      })
      return
    }

    const id = generateId('irecord')

    const insertStmt = db.prepare(`
      INSERT INTO inspection_records (id, plan_id, user_id, inspector, inspect_date, result, notes, images, converted_to_work_order)
      VALUES (@id, @plan_id, @user_id, @inspector, @inspect_date, @result, @notes, @images, NULL)
    `)
    insertStmt.run({
      id,
      plan_id,
      user_id,
      inspector,
      inspect_date,
      result,
      notes: notes || '',
      images: JSON.stringify(images || []),
    })

    if (result !== 'pass') {
      const updatePlanStmt = db.prepare(`
        UPDATE inspection_plans 
        SET completed_tasks = completed_tasks + 1, 
            status = CASE WHEN completed_tasks + 1 >= total_tasks THEN 'completed' ELSE status END
        WHERE id = ?
      `)
      updatePlanStmt.run(plan_id)
    } else {
      const updatePlanStmt = db.prepare(`
        UPDATE inspection_plans 
        SET completed_tasks = completed_tasks + 1,
            status = CASE WHEN completed_tasks + 1 >= total_tasks THEN 'completed' ELSE status END
        WHERE id = ?
      `)
      updatePlanStmt.run(plan_id)
    }

    const stmt = db.prepare('SELECT * FROM inspection_records WHERE id = ?')
    const record = stmt.get(id)

    res.json({
      success: true,
      data: {
        ...(record as Record<string, unknown>),
        images: JSON.parse((record as { images: string }).images),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '提交巡检记录失败',
    })
  }
})

router.post('/records/:id/convert-order', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { priority } = req.body

    const checkStmt = db.prepare('SELECT * FROM inspection_records WHERE id = ?')
    const record = checkStmt.get(id)

    if (!record) {
      res.status(404).json({
        success: false,
        error: '巡检记录不存在',
      })
      return
    }

    if ((record as { converted_to_work_order: string | null }).converted_to_work_order) {
      res.status(400).json({
        success: false,
        error: '该记录已转工单',
      })
      return
    }

    const userStmt = db.prepare('SELECT area FROM users WHERE id = ?')
    const user = userStmt.get((record as { user_id: string }).user_id) as { area: string } | undefined

    const gridArea = user?.area || ''

    const workerStmt = db.prepare(`
      SELECT id, name FROM grid_workers 
      WHERE area = ? AND status IN ('idle', 'on_duty')
      ORDER BY active_orders ASC
      LIMIT 1
    `)
    const worker = workerStmt.get(gridArea) as { id: string; name: string } | undefined

    const orderId = generateId('order')
    const now = new Date().toISOString().replace('T', ' ').split('.')[0]

    const insertOrderStmt = db.prepare(`
      INSERT INTO work_orders (id, user_id, type, title, description, priority, status, assignee, grid_area, created_at, dispatched_at, images, evaluation, warning_id)
      VALUES (@id, @user_id, 'inspection_issue', @title, @description, @priority, @status, @assignee, @grid_area, @created_at, @dispatched_at, '[]', NULL, NULL)
    `)
    insertOrderStmt.run({
      id: orderId,
      user_id: (record as { user_id: string }).user_id,
      title: '巡检隐患整改',
      description: (record as { notes: string }).notes || '巡检发现安全隐患，需整改',
      priority: priority || 'high',
      status: worker ? 'dispatched' : 'pending',
      assignee: worker ? worker.name : null,
      grid_area: gridArea,
      created_at: now,
      dispatched_at: worker ? now : null,
    })

    const updateRecordStmt = db.prepare(`
      UPDATE inspection_records SET converted_to_work_order = ? WHERE id = ?
    `)
    updateRecordStmt.run(orderId, id)

    if (worker) {
      const updateWorkerStmt = db.prepare(`
        UPDATE grid_workers SET status = 'on_task', active_orders = active_orders + 1
        WHERE id = ?
      `)
      updateWorkerStmt.run(worker.id)
    }

    const orderStmt = db.prepare('SELECT * FROM work_orders WHERE id = ?')
    const order = orderStmt.get(orderId)

    res.json({
      success: true,
      data: {
        work_order: {
          ...(order as Record<string, unknown>),
          images: JSON.parse((order as { images: string }).images),
        },
        record_id: id,
        auto_dispatched: !!worker,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '转工单失败',
    })
  }
})

export default router
