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
    const { status, zone_id, gate_id, dispatch_id, dispatch_item_id, start_time, end_time, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (status) {
      whereClause += ' AND ir.status = ?'
      params.push(status as string)
    }

    if (zone_id) {
      whereClause += ' AND ir.zone_id = ?'
      params.push(Number(zone_id))
    }

    if (gate_id) {
      whereClause += ' AND ir.gate_id = ?'
      params.push(Number(gate_id))
    }

    if (dispatch_id) {
      whereClause += ' AND di.plan_id = ?'
      params.push(Number(dispatch_id))
    }

    if (dispatch_item_id) {
      whereClause += ' AND ir.dispatch_item_id = ?'
      params.push(Number(dispatch_item_id))
    }

    if (start_time) {
      whereClause += ' AND ir.start_time >= ?'
      params.push(start_time as string)
    }

    if (end_time) {
      whereClause += ' AND ir.start_time <= ?'
      params.push(end_time as string)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM irrigation_records ir ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT ir.*, fz.name as zone_name, fz.code as zone_code,
             g.name as gate_name, g.code as gate_code,
             ws.scheduled_date, ws.start_time as schedule_start, ws.end_time as schedule_end,
             dp.plan_date, di.sequence as dispatch_sequence
      FROM irrigation_records ir
      LEFT JOIN farm_zones fz ON ir.zone_id = fz.id
      LEFT JOIN gates g ON ir.gate_id = g.id
      LEFT JOIN water_schedules ws ON ir.schedule_id = ws.id
      LEFT JOIN dispatch_items di ON ir.dispatch_item_id = di.id
      LEFT JOIN dispatch_plans dp ON di.plan_id = dp.id
      ${whereClause}
      ORDER BY ir.start_time DESC
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
    console.error('Get irrigation records error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取灌溉记录列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT ir.*, fz.name as zone_name, fz.code as zone_code,
             g.name as gate_name, g.code as gate_code,
             ws.scheduled_date, ws.start_time as schedule_start, ws.end_time as schedule_end,
             dp.plan_date, di.sequence as dispatch_sequence
      FROM irrigation_records ir
      LEFT JOIN farm_zones fz ON ir.zone_id = fz.id
      LEFT JOIN gates g ON ir.gate_id = g.id
      LEFT JOIN water_schedules ws ON ir.schedule_id = ws.id
      LEFT JOIN dispatch_items di ON ir.dispatch_item_id = di.id
      LEFT JOIN dispatch_plans dp ON di.plan_id = dp.id
      WHERE ir.id = ?
    `)
    const record = stmt.get(Number(id) as any)

    if (!record) {
      res.status(404).json({
        success: false,
        message: '灌溉记录不存在',
      })
      return
    }

    res.json({
      success: true,
      data: record,
    })
  } catch (error) {
    console.error('Get irrigation record error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取灌溉记录详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      schedule_id, dispatch_item_id, zone_id, gate_id,
      start_time, end_time, actual_flow, actual_volume,
      planned_volume, status, user_name
    } = req.body

    if (!zone_id || !gate_id) {
      res.status(400).json({
        success: false,
        message: '灌区、闸门为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO irrigation_records 
      (schedule_id, dispatch_item_id, zone_id, gate_id, start_time, end_time, actual_flow, actual_volume, planned_volume, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      schedule_id ? Number(schedule_id) : null,
      dispatch_item_id ? Number(dispatch_item_id) : null,
      Number(zone_id),
      Number(gate_id),
      start_time || null,
      end_time || null,
      actual_flow !== undefined ? Number(actual_flow) : null,
      actual_volume !== undefined ? Number(actual_volume) : null,
      planned_volume !== undefined ? Number(planned_volume) : null,
      status || 'in_progress'
    )

    createLog(
      user_name || '系统',
      '灌溉记录',
      '新增',
      Number(result.lastInsertRowid),
      `新增灌溉记录: 灌区${zone_id}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增灌溉记录成功',
    })
  } catch (error) {
    console.error('Create irrigation record error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增灌溉记录失败',
    })
  }
})

router.post('/:id/start', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { actual_flow, planned_volume, start_time, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM irrigation_records WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '灌溉记录不存在',
      })
      return
    }

    if (existing.status === 'completed') {
      res.status(400).json({
        success: false,
        message: '已完成的灌溉记录不能重新开始',
      })
      return
    }

    if (existing.status === 'in_progress') {
      res.status(400).json({
        success: false,
        message: '灌溉正在进行中',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE irrigation_records
      SET start_time = ?, actual_flow = ?, planned_volume = ?, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      start_time || new Date().toISOString(),
      actual_flow !== undefined ? Number(actual_flow) : existing.actual_flow,
      planned_volume !== undefined ? Number(planned_volume) : existing.planned_volume,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '灌溉记录',
      '开始灌溉',
      Number(id),
      `开始灌溉: 灌区${existing.zone_id}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '开始灌溉',
    })
  } catch (error) {
    console.error('Start irrigation error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '开始灌溉失败',
    })
  }
})

router.post('/:id/stop', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { end_time, actual_volume, actual_flow, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM irrigation_records WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '灌溉记录不存在',
      })
      return
    }

    if (existing.status !== 'in_progress') {
      res.status(400).json({
        success: false,
        message: '只有进行中的灌溉才能停止',
      })
      return
    }

    const finalEndTime = end_time || new Date().toISOString()
    let finalActualVolume = actual_volume ? Number(actual_volume) : existing.actual_volume

    if (!finalActualVolume && existing.actual_flow) {
      const startTime = new Date(existing.start_time).getTime()
      const stopTime = new Date(finalEndTime).getTime()
      const hours = (stopTime - startTime) / (1000 * 60 * 60)
      finalActualVolume = existing.actual_flow * hours
    }

    const updateStmt = db.prepare(`
      UPDATE irrigation_records
      SET end_time = ?, actual_volume = ?, actual_flow = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      finalEndTime,
      finalActualVolume,
      actual_flow !== undefined ? Number(actual_flow) : existing.actual_flow,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '灌溉记录',
      '停止灌溉',
      Number(id),
      `停止灌溉: 灌区${existing.zone_id}, 实际水量${finalActualVolume}立方米`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '停止灌溉',
    })
  } catch (error) {
    console.error('Stop irrigation error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '停止灌溉失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const {
      schedule_id, dispatch_item_id, zone_id, gate_id,
      start_time, end_time, actual_flow, actual_volume,
      planned_volume, status, user_name
    } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM irrigation_records WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '灌溉记录不存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE irrigation_records
      SET schedule_id = ?, dispatch_item_id = ?, zone_id = ?, gate_id = ?, start_time = ?, end_time = ?, actual_flow = ?, actual_volume = ?, planned_volume = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      schedule_id !== undefined ? Number(schedule_id) : existing.schedule_id,
      dispatch_item_id !== undefined ? Number(dispatch_item_id) : existing.dispatch_item_id,
      Number(zone_id) || existing.zone_id,
      Number(gate_id) || existing.gate_id,
      start_time !== undefined ? start_time : existing.start_time,
      end_time !== undefined ? end_time : existing.end_time,
      actual_flow !== undefined ? Number(actual_flow) : existing.actual_flow,
      actual_volume !== undefined ? Number(actual_volume) : existing.actual_volume,
      planned_volume !== undefined ? Number(planned_volume) : existing.planned_volume,
      status || existing.status,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '灌溉记录',
      '更新',
      Number(id),
      `更新灌溉记录: ${id}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新灌溉记录成功',
    })
  } catch (error) {
    console.error('Update irrigation record error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新灌溉记录失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM irrigation_records WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '灌溉记录不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM irrigation_records WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '灌溉记录',
      '删除',
      Number(id),
      `删除灌溉记录: ${id}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除灌溉记录成功',
    })
  } catch (error) {
    console.error('Delete irrigation record error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除灌溉记录失败',
    })
  }
})

export default router
