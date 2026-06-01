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
    const { status, plan_date, start_date, end_date, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (status) {
      whereClause += ' AND dp.status = ?'
      params.push(status as string)
    }

    if (plan_date) {
      whereClause += ' AND dp.plan_date = ?'
      params.push(plan_date as string)
    }

    if (start_date) {
      whereClause += ' AND dp.plan_date >= ?'
      params.push(start_date as string)
    }

    if (end_date) {
      whereClause += ' AND dp.plan_date <= ?'
      params.push(end_date as string)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM dispatch_plans dp ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT dp.*,
             (SELECT COUNT(*) FROM dispatch_items di WHERE di.plan_id = dp.id) as item_count
      FROM dispatch_plans dp
      ${whereClause}
      ORDER BY dp.plan_date DESC, dp.created_at DESC
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
    console.error('Get dispatches error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取调度计划列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const planStmt = db.prepare(`
      SELECT dp.*,
             (SELECT COUNT(*) FROM dispatch_items di WHERE di.plan_id = dp.id) as item_count
      FROM dispatch_plans dp
      WHERE dp.id = ?
    `)
    const plan = planStmt.get(Number(id) as any)

    if (!plan) {
      res.status(404).json({
        success: false,
        message: '调度计划不存在',
      })
      return
    }

    const itemsStmt = db.prepare(`
      SELECT di.*,
             fz.name as zone_name, fz.code as zone_code,
             g.name as gate_name, g.code as gate_code,
             ps.name as pump_station_name, ps.code as pump_station_code,
             ws.scheduled_date, ws.start_time as schedule_start, ws.end_time as schedule_end
      FROM dispatch_items di
      LEFT JOIN farm_zones fz ON di.zone_id = fz.id
      LEFT JOIN gates g ON di.gate_id = g.id
      LEFT JOIN pump_stations ps ON di.pump_station_id = ps.id
      LEFT JOIN water_schedules ws ON di.schedule_id = ws.id
      WHERE di.plan_id = ?
      ORDER BY di.sequence ASC, di.start_time ASC
    `)
    const items = itemsStmt.all(Number(id))

    const adjustmentsStmt = db.prepare(`
      SELECT da.* FROM dispatch_adjustments da
      WHERE da.plan_id = ?
      ORDER BY da.created_at DESC
    `)
    const adjustments = adjustmentsStmt.all(Number(id))

    res.json({
      success: true,
      data: {
        ...plan,
        items,
        adjustments,
      },
    })
  } catch (error) {
    console.error('Get dispatch error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取调度计划详情失败',
    })
  }
})

router.get('/:id/items', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT di.*,
             fz.name as zone_name, fz.code as zone_code,
             g.name as gate_name, g.code as gate_code,
             ps.name as pump_station_name, ps.code as pump_station_code
      FROM dispatch_items di
      LEFT JOIN farm_zones fz ON di.zone_id = fz.id
      LEFT JOIN gates g ON di.gate_id = g.id
      LEFT JOIN pump_stations ps ON di.pump_station_id = ps.id
      WHERE di.plan_id = ?
      ORDER BY di.sequence ASC, di.start_time ASC
    `)
    const items = stmt.all(Number(id))

    res.json({
      success: true,
      data: items,
    })
  } catch (error) {
    console.error('Get dispatch items error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取调度明细失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      plan_date, water_source, water_level, pump_capacity,
      rotation_rule, total_planned_volume, status,
      generated_by, description, user_name
    } = req.body

    if (!plan_date || !water_source || !water_level || !pump_capacity || !total_planned_volume) {
      res.status(400).json({
        success: false,
        message: '计划日期、水源、水位、水泵流量、总计划水量为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO dispatch_plans 
      (plan_date, water_source, water_level, pump_capacity, rotation_rule, total_planned_volume, status, generated_by, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      plan_date,
      water_source,
      Number(water_level),
      Number(pump_capacity),
      rotation_rule || '',
      Number(total_planned_volume),
      status || 'draft',
      generated_by || '',
      description || ''
    )

    createLog(
      user_name || generated_by || '系统',
      '调度计划',
      '新增',
      Number(result.lastInsertRowid),
      `新增调度计划: ${plan_date}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增调度计划成功',
    })
  } catch (error) {
    console.error('Create dispatch error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增调度计划失败',
    })
  }
})

router.post('/generate-from-schedules', (req: Request, res: Response): void => {
  try {
    const { plan_date, water_source, water_level, pump_capacity, rotation_rule, generated_by, user_name } = req.body

    if (!plan_date || !water_source || !water_level || !pump_capacity) {
      res.status(400).json({
        success: false,
        message: '计划日期、水源、水位、水泵流量为必填项',
      })
      return
    }

    const schedules = db.prepare(`
      SELECT ws.*, fz.canal_id, cs.name as canal_name,
             ps.id as pump_station_id
      FROM water_schedules ws
      LEFT JOIN farm_zones fz ON ws.zone_id = fz.id
      LEFT JOIN canal_systems cs ON fz.canal_id = cs.id
      LEFT JOIN pump_stations ps ON ps.canal_id = fz.canal_id
      WHERE ws.scheduled_date = ? AND ws.status = 'scheduled'
      ORDER BY ws.sequence ASC, ws.start_time ASC
    `).all(plan_date)

    if (schedules.length === 0) {
      res.status(400).json({
        success: false,
        message: '该日期没有待执行的用水计划',
      })
      return
    }

    let totalPlannedVolume = 0
    schedules.forEach((s: any) => {
      totalPlannedVolume += Number(s.planned_volume)
    })

    const insertPlan = db.prepare(`
      INSERT INTO dispatch_plans 
      (plan_date, water_source, water_level, pump_capacity, rotation_rule, total_planned_volume, status, generated_by, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const planResult = insertPlan.run(
      plan_date,
      water_source,
      Number(water_level),
      Number(pump_capacity),
      rotation_rule || '轮灌',
      totalPlannedVolume,
      'draft',
      generated_by || '系统自动',
      `由系统根据${plan_date}用水计划自动生成`
    )
    const planId = Number(planResult.lastInsertRowid)

    const insertItem = db.prepare(`
      INSERT INTO dispatch_items 
      (plan_id, schedule_id, zone_id, gate_id, pump_station_id, start_time, end_time, flow_rate, volume, sequence, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)

    schedules.forEach((s: any, index: number) => {
      insertItem.run(
        planId,
        Number(s.id),
        Number(s.zone_id),
        Number(s.gate_id),
        s.pump_station_id ? Number(s.pump_station_id) : null,
        `${plan_date} ${s.start_time}`,
        `${plan_date} ${s.end_time}`,
        Number(s.planned_flow),
        Number(s.planned_volume),
        index + 1,
        'pending'
      )
    })

    createLog(
      user_name || generated_by || '系统',
      '调度计划',
      '生成',
      planId,
      `根据用水计划自动生成调度计划: ${plan_date}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: planId, item_count: schedules.length },
      message: '生成调度计划成功',
    })
  } catch (error) {
    console.error('Generate dispatch error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '生成调度计划失败',
    })
  }
})

router.post('/:id/adjust', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const {
      water_source, water_level, pump_capacity, rotation_rule,
      total_planned_volume, status, adjust_reason, adjusted_by,
      items, user_name
    } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM dispatch_plans WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '调度计划不存在',
      })
      return
    }

    if (!adjust_reason) {
      res.status(400).json({
        success: false,
        message: '调整原因为必填项',
      })
      return
    }

    const updatePlan = db.prepare(`
      UPDATE dispatch_plans
      SET water_source = ?, water_level = ?, pump_capacity = ?, rotation_rule = ?, total_planned_volume = ?, status = ?, adjusted_by = ?, adjust_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updatePlan.run(
      water_source || existing.water_source,
      Number(water_level) || existing.water_level,
      Number(pump_capacity) || existing.pump_capacity,
      rotation_rule || existing.rotation_rule,
      Number(total_planned_volume) || existing.total_planned_volume,
      status || existing.status,
      adjusted_by || '',
      adjust_reason,
      Number(id)
    )

    const insertAdjustment = db.prepare(`
      INSERT INTO dispatch_adjustments 
      (plan_id, original_value, new_value, adjust_reason, adjusted_by)
      VALUES (?, ?, ?, ?, ?)
    `)
    insertAdjustment.run(
      Number(id),
      JSON.stringify({
        water_source: existing.water_source,
        water_level: existing.water_level,
        pump_capacity: existing.pump_capacity,
        total_planned_volume: existing.total_planned_volume,
      }),
      JSON.stringify({
        water_source: water_source || existing.water_source,
        water_level: Number(water_level) || existing.water_level,
        pump_capacity: Number(pump_capacity) || existing.pump_capacity,
        total_planned_volume: Number(total_planned_volume) || existing.total_planned_volume,
      }),
      adjust_reason,
      adjusted_by || ''
    )

    if (items && Array.isArray(items)) {
      const deleteItems = db.prepare(`
        DELETE FROM dispatch_items WHERE plan_id = ? AND id IN (${items.map((i: any) => i.id).filter((id: number) => id).join(',') || '0'})
      `)
      
      const updateItem = db.prepare(`
        UPDATE dispatch_items
        SET start_time = ?, end_time = ?, flow_rate = ?, volume = ?, sequence = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND plan_id = ?
      `)

      items.forEach((item: any) => {
        if (item.id && item._deleted) {
          deleteItems.run(Number(id))
        } else if (item.id) {
          updateItem.run(
            item.start_time,
            item.end_time,
            Number(item.flow_rate),
            Number(item.volume),
            Number(item.sequence),
            item.status || 'pending',
            Number(item.id),
            Number(id)
          )
        } else {
          const insertItem = db.prepare(`
            INSERT INTO dispatch_items 
            (plan_id, schedule_id, zone_id, gate_id, pump_station_id, start_time, end_time, flow_rate, volume, sequence, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `)
          insertItem.run(
            Number(id),
            item.schedule_id ? Number(item.schedule_id) : null,
            Number(item.zone_id),
            Number(item.gate_id),
            item.pump_station_id ? Number(item.pump_station_id) : null,
            item.start_time,
            item.end_time,
            Number(item.flow_rate),
            Number(item.volume),
            Number(item.sequence),
            item.status || 'pending'
          )
        }
      })
    }

    createLog(
      user_name || adjusted_by || '系统',
      '调度计划',
      '调整',
      Number(id),
      `调整调度计划: ${existing.plan_date}, 原因: ${adjust_reason}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '调整调度计划成功',
    })
  } catch (error) {
    console.error('Adjust dispatch error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '调整调度计划失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const {
      plan_date, water_source, water_level, pump_capacity, rotation_rule,
      total_planned_volume, status, description, user_name
    } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM dispatch_plans WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '调度计划不存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE dispatch_plans
      SET plan_date = ?, water_source = ?, water_level = ?, pump_capacity = ?, rotation_rule = ?, total_planned_volume = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      plan_date || existing.plan_date,
      water_source || existing.water_source,
      Number(water_level) || existing.water_level,
      Number(pump_capacity) || existing.pump_capacity,
      rotation_rule || existing.rotation_rule,
      Number(total_planned_volume) || existing.total_planned_volume,
      status || existing.status,
      description !== undefined ? description : existing.description,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '调度计划',
      '更新',
      Number(id),
      `更新调度计划: ${plan_date || existing.plan_date}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新调度计划成功',
    })
  } catch (error) {
    console.error('Update dispatch error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新调度计划失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM dispatch_plans WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '调度计划不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM dispatch_plans WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '调度计划',
      '删除',
      Number(id),
      `删除调度计划: ${existing.plan_date}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除调度计划成功',
    })
  } catch (error) {
    console.error('Delete dispatch error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除调度计划失败',
    })
  }
})

router.post('/items', (req: Request, res: Response): void => {
  try {
    const {
      plan_id, schedule_id, zone_id, gate_id, pump_station_id,
      start_time, end_time, flow_rate, volume, sequence, status, user_name
    } = req.body

    if (!plan_id || !zone_id || !gate_id || !start_time || !end_time || !flow_rate || !volume) {
      res.status(400).json({
        success: false,
        message: '计划ID、灌区、闸门、起止时间、流量、水量为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO dispatch_items 
      (plan_id, schedule_id, zone_id, gate_id, pump_station_id, start_time, end_time, flow_rate, volume, sequence, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      Number(plan_id),
      schedule_id ? Number(schedule_id) : null,
      Number(zone_id),
      Number(gate_id),
      pump_station_id ? Number(pump_station_id) : null,
      start_time,
      end_time,
      Number(flow_rate),
      Number(volume),
      sequence ? Number(sequence) : null,
      status || 'pending'
    )

    createLog(
      user_name || '系统',
      '调度明细',
      '新增',
      Number(result.lastInsertRowid),
      `新增调度明细: ${start_time}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增调度明细成功',
    })
  } catch (error) {
    console.error('Create dispatch item error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增调度明细失败',
    })
  }
})

router.put('/items/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const {
      schedule_id, zone_id, gate_id, pump_station_id,
      start_time, end_time, flow_rate, volume, sequence, status, user_name
    } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM dispatch_items WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '调度明细不存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE dispatch_items
      SET schedule_id = ?, zone_id = ?, gate_id = ?, pump_station_id = ?, start_time = ?, end_time = ?, flow_rate = ?, volume = ?, sequence = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      schedule_id !== undefined ? Number(schedule_id) : existing.schedule_id,
      Number(zone_id) || existing.zone_id,
      Number(gate_id) || existing.gate_id,
      pump_station_id !== undefined ? Number(pump_station_id) : existing.pump_station_id,
      start_time || existing.start_time,
      end_time || existing.end_time,
      Number(flow_rate) || existing.flow_rate,
      Number(volume) || existing.volume,
      sequence !== undefined ? Number(sequence) : existing.sequence,
      status || existing.status,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '调度明细',
      '更新',
      Number(id),
      `更新调度明细: ${start_time || existing.start_time}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新调度明细成功',
    })
  } catch (error) {
    console.error('Update dispatch item error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新调度明细失败',
    })
  }
})

router.delete('/items/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM dispatch_items WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '调度明细不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM dispatch_items WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '调度明细',
      '删除',
      Number(id),
      `删除调度明细: ${existing.start_time}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除调度明细成功',
    })
  } catch (error) {
    console.error('Delete dispatch item error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除调度明细失败',
    })
  }
})

export default router
