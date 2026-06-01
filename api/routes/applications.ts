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
    const { status, zone_id, crop_type_id, applicant_type, priority, keyword, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (status) {
      whereClause += ' AND wa.status = ?'
      params.push(status as string)
    }

    if (zone_id) {
      whereClause += ' AND wa.zone_id = ?'
      params.push(Number(zone_id))
    }

    if (crop_type_id) {
      whereClause += ' AND wa.crop_type_id = ?'
      params.push(Number(crop_type_id))
    }

    if (applicant_type) {
      whereClause += ' AND wa.applicant_type = ?'
      params.push(applicant_type as string)
    }

    if (priority) {
      whereClause += ' AND wa.priority = ?'
      params.push(Number(priority))
    }

    if (keyword) {
      whereClause += ' AND (wa.applicant_name LIKE ? OR wa.reason LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM water_applications wa ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT wa.*, ct.name as crop_name, ct.code as crop_code,
             fz.name as zone_name, fz.code as zone_code
      FROM water_applications wa
      LEFT JOIN crop_types ct ON wa.crop_type_id = ct.id
      LEFT JOIN farm_zones fz ON wa.zone_id = fz.id
      ${whereClause}
      ORDER BY wa.priority ASC, wa.created_at DESC
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
    console.error('Get applications error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取申请列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT wa.*, ct.name as crop_name, ct.code as crop_code,
             fz.name as zone_name, fz.code as zone_code,
             fz.canal_id, cs.name as canal_name
      FROM water_applications wa
      LEFT JOIN crop_types ct ON wa.crop_type_id = ct.id
      LEFT JOIN farm_zones fz ON wa.zone_id = fz.id
      LEFT JOIN canal_systems cs ON fz.canal_id = cs.id
      WHERE wa.id = ?
    `)
    const application = stmt.get(Number(id) as any)

    if (!application) {
      res.status(404).json({
        success: false,
        message: '申请不存在',
      })
      return
    }

    res.json({
      success: true,
      data: application,
    })
  } catch (error) {
    console.error('Get application error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取申请详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      applicant_name, applicant_type, zone_id, crop_type_id,
      irrigation_area, start_date, end_date, estimated_water,
      priority, reason, created_by, user_name
    } = req.body

    if (!applicant_name || !applicant_type || !zone_id || !crop_type_id ||
        !irrigation_area || !start_date || !end_date || !estimated_water) {
      res.status(400).json({
        success: false,
        message: '申请人名称、类型、灌区、作物、灌溉面积、起止日期、预估水量为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO water_applications 
      (applicant_name, applicant_type, zone_id, crop_type_id, irrigation_area, start_date, end_date, estimated_water, priority, status, reason, created_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      applicant_name,
      applicant_type,
      Number(zone_id),
      Number(crop_type_id),
      Number(irrigation_area),
      start_date,
      end_date,
      Number(estimated_water),
      Number(priority) || 5,
      'pending',
      reason || '',
      created_by || ''
    )

    createLog(
      user_name || created_by || '系统',
      '用水申请',
      '新增',
      Number(result.lastInsertRowid),
      `新增用水申请: ${applicant_name} - ${irrigation_area}亩`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '提交申请成功',
    })
  } catch (error) {
    console.error('Create application error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '提交申请失败',
    })
  }
})

router.post('/:id/approve', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { reviewed_by, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM water_applications WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '申请不存在',
      })
      return
    }

    if (existing.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: '只有待审核的申请才能审批',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE water_applications
      SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(reviewed_by || '', Number(id))

    createLog(
      user_name || reviewed_by || '系统',
      '用水申请',
      '审批通过',
      Number(id),
      `审批通过申请: ${existing.applicant_name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '审批通过',
    })
  } catch (error) {
    console.error('Approve application error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '审批失败',
    })
  }
})

router.post('/:id/reject', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { reviewed_by, reason, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM water_applications WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '申请不存在',
      })
      return
    }

    if (existing.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: '只有待审核的申请才能审批',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE water_applications
      SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(reviewed_by || '', reason || existing.reason, Number(id))

    createLog(
      user_name || reviewed_by || '系统',
      '用水申请',
      '审批驳回',
      Number(id),
      `审批驳回申请: ${existing.applicant_name}, 原因: ${reason}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '已驳回申请',
    })
  } catch (error) {
    console.error('Reject application error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '驳回失败',
    })
  }
})

router.post('/:id/generate-schedule', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { gate_id, scheduled_date, start_time, end_time, planned_flow, planned_volume, sequence, description, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM water_applications WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '申请不存在',
      })
      return
    }

    if (existing.status !== 'approved') {
      res.status(400).json({
        success: false,
        message: '只有已通过的申请才能生成计划',
      })
      return
    }

    if (!gate_id || !scheduled_date || !start_time || !end_time || !planned_flow || !planned_volume) {
      res.status(400).json({
        success: false,
        message: '闸门、计划日期、起止时间、计划流量、计划水量为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO water_schedules 
      (application_id, gate_id, zone_id, scheduled_date, start_time, end_time, planned_flow, planned_volume, status, sequence, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      Number(id),
      Number(gate_id),
      existing.zone_id,
      scheduled_date,
      start_time,
      end_time,
      Number(planned_flow),
      Number(planned_volume),
      'scheduled',
      sequence ? Number(sequence) : null,
      description || ''
    )

    createLog(
      user_name || '系统',
      '用水计划',
      '生成',
      Number(result.lastInsertRowid),
      `为申请 ${existing.applicant_name} 生成用水计划`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '生成计划成功',
    })
  } catch (error) {
    console.error('Generate schedule error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '生成计划失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const {
      applicant_name, applicant_type, zone_id, crop_type_id,
      irrigation_area, start_date, end_date, estimated_water,
      priority, reason, user_name
    } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM water_applications WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '申请不存在',
      })
      return
    }

    if (existing.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: '只有待审核的申请才能编辑',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE water_applications
      SET applicant_name = ?, applicant_type = ?, zone_id = ?, crop_type_id = ?, irrigation_area = ?, start_date = ?, end_date = ?, estimated_water = ?, priority = ?, reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      applicant_name || existing.applicant_name,
      applicant_type || existing.applicant_type,
      Number(zone_id) || existing.zone_id,
      Number(crop_type_id) || existing.crop_type_id,
      Number(irrigation_area) || existing.irrigation_area,
      start_date || existing.start_date,
      end_date || existing.end_date,
      Number(estimated_water) || existing.estimated_water,
      Number(priority) || existing.priority,
      reason !== undefined ? reason : existing.reason,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '用水申请',
      '更新',
      Number(id),
      `更新申请: ${applicant_name || existing.applicant_name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新申请成功',
    })
  } catch (error) {
    console.error('Update application error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新申请失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM water_applications WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '申请不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM water_applications WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '用水申请',
      '删除',
      Number(id),
      `删除申请: ${existing.applicant_name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除申请成功',
    })
  } catch (error) {
    console.error('Delete application error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除申请失败',
    })
  }
})

export default router
