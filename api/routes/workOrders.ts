// @ts-nocheck
import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
}

function createLog(
  user_name: string,
  module: string,
  action: string,
  target_id: number | null,
  details: string,
  ip_address: string
): void {
  const insertLog = db.prepare(`
    INSERT INTO operation_logs (user_name, module, action, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertLog.run(user_name, module, action, target_id, details, ip_address)
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status, device_type, device_id, order_type, priority, assignee, start_time, end_time, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (status) {
      whereClause += ' AND wo.status = ?'
      params.push(status as string)
    }

    if (device_type) {
      whereClause += ' AND wo.device_type = ?'
      params.push(device_type as string)
    }

    if (device_id) {
      whereClause += ' AND wo.device_id = ?'
      params.push(Number(device_id))
    }

    if (order_type) {
      whereClause += ' AND wo.order_type = ?'
      params.push(order_type as string)
    }

    if (priority) {
      whereClause += ' AND wo.priority = ?'
      params.push(priority as string)
    }

    if (assignee) {
      whereClause += ' AND wo.assignee = ?'
      params.push(assignee as string)
    }

    if (start_time) {
      whereClause += ' AND wo.created_at >= ?'
      params.push(start_time as string)
    }

    if (end_time) {
      whereClause += ' AND wo.created_at <= ?'
      params.push(end_time as string)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM work_orders wo ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT wo.*, a.alarm_type, a.alarm_level, a.alarm_message
      FROM work_orders wo
      LEFT JOIN alarms a ON wo.alarm_id = a.id
      ${whereClause}
      ORDER BY 
        CASE wo.priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5 
        END,
        wo.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const list = listStmt.all(...params, Number(pageSize), offset)

    res.json({
      success: true,
      data: {
        list,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error) {
    console.error('Get work orders error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取工单列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT wo.*, a.alarm_type, a.alarm_level, a.alarm_message
      FROM work_orders wo
      LEFT JOIN alarms a ON wo.alarm_id = a.id
      WHERE wo.id = ?
    `)
    const order = stmt.get(Number(id) as any)

    if (!order) {
      res.status(404).json({
        success: false,
        message: '工单不存在',
      })
      return
    }

    res.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Get work order error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取工单详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      alarm_id, device_type, device_id, device_code,
      order_type, priority, description, assignee, created_by, user_name
    } = req.body

    if (!device_type || !device_id || !device_code || !order_type || !priority || !description) {
      res.status(400).json({
        success: false,
        message: '设备类型、设备ID、设备编码、工单类型、优先级、描述为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO work_orders 
      (alarm_id, device_type, device_id, device_code, order_type, priority, status, description, assignee, created_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      alarm_id ? Number(alarm_id) : null,
      device_type,
      Number(device_id),
      device_code,
      order_type,
      priority,
      'pending',
      description,
      assignee || '',
      created_by || ''
    )

    createLog(
      user_name || created_by || '系统',
      '工单管理',
      '新增',
      Number(result.lastInsertRowid),
      `新增工单: ${device_code} - ${description}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增工单成功',
    })
  } catch (error) {
    console.error('Create work order error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增工单失败',
    })
  }
})

router.post('/:id/assign', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { assignee, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM work_orders WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '工单不存在',
      })
      return
    }

    if (existing.status === 'completed') {
      res.status(400).json({
        success: false,
        message: '已完成的工单不能分配',
      })
      return
    }

    if (!assignee) {
      res.status(400).json({
        success: false,
        message: '处理人为必填项',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE work_orders
      SET assignee = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(assignee, Number(id))

    createLog(
      user_name || '系统',
      '工单管理',
      '分配',
      Number(id),
      `分配工单: ${existing.device_code} 给 ${assignee}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '工单分配成功',
    })
  } catch (error) {
    console.error('Assign work order error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '工单分配失败',
    })
  }
})

router.post('/:id/complete', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { completed_by, description, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM work_orders WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '工单不存在',
      })
      return
    }

    if (existing.status === 'completed') {
      res.status(400).json({
        success: false,
        message: '工单已完成',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE work_orders
      SET status = 'completed', completed_by = ?, completed_at = CURRENT_TIMESTAMP, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(completed_by || '', description || existing.description, Number(id))

    createLog(
      user_name || completed_by || '系统',
      '工单管理',
      '完成',
      Number(id),
      `完成工单: ${existing.device_code}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '工单完成',
    })
  } catch (error) {
    console.error('Complete work order error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '工单完成失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const {
      alarm_id, device_type, device_id, device_code,
      order_type, priority, status, description, assignee, user_name
    } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM work_orders WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '工单不存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE work_orders
      SET alarm_id = ?, device_type = ?, device_id = ?, device_code = ?, order_type = ?, priority = ?, status = ?, description = ?, assignee = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      alarm_id !== undefined ? Number(alarm_id) : existing.alarm_id,
      device_type || existing.device_type,
      Number(device_id) || existing.device_id,
      device_code || existing.device_code,
      order_type || existing.order_type,
      priority || existing.priority,
      status || existing.status,
      description !== undefined ? description : existing.description,
      assignee !== undefined ? assignee : existing.assignee,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '工单管理',
      '更新',
      Number(id),
      `更新工单: ${device_code || existing.device_code}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新工单成功',
    })
  } catch (error) {
    console.error('Update work order error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新工单失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM work_orders WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '工单不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM work_orders WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '工单管理',
      '删除',
      Number(id),
      `删除工单: ${existing.device_code} - ${existing.description}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除工单成功',
    })
  } catch (error) {
    console.error('Delete work order error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除工单失败',
    })
  }
})

export default router
