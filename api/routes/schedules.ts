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
    const { status, application_id, zone_id, gate_id, scheduled_date, start_date, end_date, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (status) {
      whereClause += ' AND ws.status = ?'
      params.push(status as string)
    }

    if (application_id) {
      whereClause += ' AND ws.application_id = ?'
      params.push(Number(application_id))
    }

    if (zone_id) {
      whereClause += ' AND ws.zone_id = ?'
      params.push(Number(zone_id))
    }

    if (gate_id) {
      whereClause += ' AND ws.gate_id = ?'
      params.push(Number(gate_id))
    }

    if (scheduled_date) {
      whereClause += ' AND ws.scheduled_date = ?'
      params.push(scheduled_date as string)
    }

    if (start_date) {
      whereClause += ' AND ws.scheduled_date >= ?'
      params.push(start_date as string)
    }

    if (end_date) {
      whereClause += ' AND ws.scheduled_date <= ?'
      params.push(end_date as string)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM water_schedules ws ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT ws.*, wa.applicant_name, wa.irrigation_area,
             fz.name as zone_name, fz.code as zone_code,
             g.name as gate_name, g.code as gate_code
      FROM water_schedules ws
      LEFT JOIN water_applications wa ON ws.application_id = wa.id
      LEFT JOIN farm_zones fz ON ws.zone_id = fz.id
      LEFT JOIN gates g ON ws.gate_id = g.id
      ${whereClause}
      ORDER BY ws.scheduled_date ASC, ws.sequence ASC, ws.created_at DESC
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
    console.error('Get schedules error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取计划列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT ws.*, wa.applicant_name, wa.irrigation_area, wa.estimated_water,
             fz.name as zone_name, fz.code as zone_code,
             g.name as gate_name, g.code as gate_code,
             ct.name as crop_name, cs.name as canal_name
      FROM water_schedules ws
      LEFT JOIN water_applications wa ON ws.application_id = wa.id
      LEFT JOIN farm_zones fz ON ws.zone_id = fz.id
      LEFT JOIN gates g ON ws.gate_id = g.id
      LEFT JOIN crop_types ct ON wa.crop_type_id = ct.id
      LEFT JOIN canal_systems cs ON fz.canal_id = cs.id
      WHERE ws.id = ?
    `)
    const schedule = stmt.get(Number(id) as any)

    if (!schedule) {
      res.status(404).json({
        success: false,
        message: '计划不存在',
      })
      return
    }

    res.json({
      success: true,
      data: schedule,
    })
  } catch (error) {
    console.error('Get schedule error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取计划详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      application_id, gate_id, zone_id, scheduled_date,
      start_time, end_time, planned_flow, planned_volume,
      status, sequence, description, user_name
    } = req.body

    if (!gate_id || !zone_id || !scheduled_date || !start_time || !end_time || !planned_flow || !planned_volume) {
      res.status(400).json({
        success: false,
        message: '闸门、灌区、计划日期、起止时间、计划流量、计划水量为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO water_schedules 
      (application_id, gate_id, zone_id, scheduled_date, start_time, end_time, planned_flow, planned_volume, status, sequence, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      application_id ? Number(application_id) : null,
      Number(gate_id),
      Number(zone_id),
      scheduled_date,
      start_time,
      end_time,
      Number(planned_flow),
      Number(planned_volume),
      status || 'scheduled',
      sequence ? Number(sequence) : null,
      description || ''
    )

    createLog(
      user_name || '系统',
      '用水计划',
      '新增',
      Number(result.lastInsertRowid),
      `新增用水计划: ${scheduled_date} ${start_time}-${end_time}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增计划成功',
    })
  } catch (error) {
    console.error('Create schedule error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增计划失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const {
      application_id, gate_id, zone_id, scheduled_date,
      start_time, end_time, planned_flow, planned_volume,
      status, sequence, description, user_name
    } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM water_schedules WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '计划不存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE water_schedules
      SET application_id = ?, gate_id = ?, zone_id = ?, scheduled_date = ?, start_time = ?, end_time = ?, planned_flow = ?, planned_volume = ?, status = ?, sequence = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      application_id !== undefined ? Number(application_id) : existing.application_id,
      Number(gate_id) || existing.gate_id,
      Number(zone_id) || existing.zone_id,
      scheduled_date || existing.scheduled_date,
      start_time || existing.start_time,
      end_time || existing.end_time,
      Number(planned_flow) || existing.planned_flow,
      Number(planned_volume) || existing.planned_volume,
      status || existing.status,
      sequence !== undefined ? Number(sequence) : existing.sequence,
      description !== undefined ? description : existing.description,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '用水计划',
      '更新',
      Number(id),
      `更新用水计划: ${scheduled_date || existing.scheduled_date}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新计划成功',
    })
  } catch (error) {
    console.error('Update schedule error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新计划失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM water_schedules WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '计划不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM water_schedules WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '用水计划',
      '删除',
      Number(id),
      `删除用水计划: ${existing.scheduled_date}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除计划成功',
    })
  } catch (error) {
    console.error('Delete schedule error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除计划失败',
    })
  }
})

export default router
