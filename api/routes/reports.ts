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
    const { report_type, report_period, zone_id, start_date, end_date, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (report_type) {
      whereClause += ' AND wr.report_type = ?'
      params.push(report_type as string)
    }

    if (report_period) {
      whereClause += ' AND wr.report_period = ?'
      params.push(report_period as string)
    }

    if (zone_id) {
      whereClause += ' AND wr.zone_id = ?'
      params.push(Number(zone_id))
    }

    if (start_date) {
      whereClause += ' AND wr.report_date >= ?'
      params.push(start_date as string)
    }

    if (end_date) {
      whereClause += ' AND wr.report_date <= ?'
      params.push(end_date as string)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM water_reports wr ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT wr.*, fz.name as zone_name, fz.code as zone_code
      FROM water_reports wr
      LEFT JOIN farm_zones fz ON wr.zone_id = fz.id
      ${whereClause}
      ORDER BY wr.report_date DESC
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
    console.error('Get reports error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取报告列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT wr.*, fz.name as zone_name, fz.code as zone_code,
             fz.area as zone_area
      FROM water_reports wr
      LEFT JOIN farm_zones fz ON wr.zone_id = fz.id
      WHERE wr.id = ?
    `)
    const report = stmt.get(Number(id) as any)

    if (!report) {
      res.status(404).json({
        success: false,
        message: '报告不存在',
      })
      return
    }

    res.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Get report error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取报告详情失败',
    })
  }
})

router.get('/statistics/summary', (req: Request, res: Response): void => {
  try {
    const { start_date, end_date, zone_id } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (start_date) {
      whereClause += ' AND report_date >= ?'
      params.push(start_date as string)
    }

    if (end_date) {
      whereClause += ' AND report_date <= ?'
      params.push(end_date as string)
    }

    if (zone_id) {
      whereClause += ' AND zone_id = ?'
      params.push(Number(zone_id))
    }

    const summaryStmt = db.prepare(`
      SELECT 
        COUNT(*) as report_count,
        SUM(planned_water) as total_planned_water,
        SUM(actual_water) as total_actual_water,
        SUM(water_loss) as total_water_loss,
        SUM(deficit) as total_deficit,
        AVG(completion_rate) as avg_completion_rate,
        SUM(irrigation_area) as total_irrigation_area
      FROM water_reports
      ${whereClause}
    `)
    const summary = summaryStmt.get(...params) as any

    const byZoneStmt = db.prepare(`
      SELECT 
        zone_id,
        fz.name as zone_name,
        SUM(planned_water) as total_planned_water,
        SUM(actual_water) as total_actual_water,
        AVG(completion_rate) as avg_completion_rate
      FROM water_reports wr
      LEFT JOIN farm_zones fz ON wr.zone_id = fz.id
      ${whereClause}
      GROUP BY zone_id
      ORDER BY total_actual_water DESC
    `)
    const byZone = byZoneStmt.all(...params)

    const byTypeStmt = db.prepare(`
      SELECT 
        report_type,
        COUNT(*) as count,
        SUM(planned_water) as total_planned_water,
        SUM(actual_water) as total_actual_water
      FROM water_reports
      ${whereClause}
      GROUP BY report_type
    `)
    const byType = byTypeStmt.all(...params)

    res.json({
      success: true,
      data: {
        summary,
        by_zone: byZone,
        by_type: byType,
      },
    })
  } catch (error) {
    console.error('Get statistics error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取统计汇总失败',
    })
  }
})

router.post('/generate-daily', (req: Request, res: Response): void => {
  try {
    const { report_date, zone_id, user_name } = req.body

    if (!report_date) {
      res.status(400).json({
        success: false,
        message: '报告日期为必填项',
      })
      return
    }

    const zones = db.prepare(`
      SELECT id, name, area FROM farm_zones
      ${zone_id ? 'WHERE id = ?' : ''}
    `).all(zone_id ? Number(zone_id) : undefined)

    const results: { zone_id: number; report_id: number | bigint }[] = []
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO water_reports 
      (report_type, report_period, report_date, zone_id, planned_water, actual_water, water_loss, deficit, completion_rate, irrigation_area, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)

    zones.forEach((zone: any) => {
      const zoneId = Number(zone.id)
      const dailyRecords = db.prepare(`
        SELECT 
          COALESCE(SUM(planned_volume), 0) as planned_water,
          COALESCE(SUM(actual_volume), 0) as actual_water,
          COUNT(*) as irrigation_count
        FROM irrigation_records
        WHERE zone_id = ? 
          AND DATE(start_time) = ?
          AND status = 'completed'
      `).get(zoneId, report_date) as any

      const plannedWater = Number(dailyRecords.planned_water) || 0
      const actualWater = Number(dailyRecords.actual_water) || 0
      const waterLoss = plannedWater > 0 ? plannedWater - actualWater : 0
      const deficit = actualWater > 0 && plannedWater > actualWater ? plannedWater - actualWater : 0
      const completionRate = plannedWater > 0 ? Math.round((actualWater / plannedWater) * 10000) / 100 : 0

      const result = insertStmt.run(
        'daily',
        report_date,
        report_date,
        zoneId,
        plannedWater,
        actualWater,
        waterLoss,
        deficit,
        completionRate,
        Number(zone.area) || 0,
        `${zone.name} ${report_date} 用水日报`
      )

      results.push({ zone_id: zoneId, report_id: result.lastInsertRowid })
    })

    createLog(
      user_name || '系统',
      '用水报告',
      '生成日报',
      null,
      `生成${report_date}日报，共${zones.length}个灌区`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: results,
      message: `生成${report_date}日报成功`,
    })
  } catch (error) {
    console.error('Generate daily report error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '生成日报失败',
    })
  }
})

router.post('/generate-monthly', (req: Request, res: Response): void => {
  try {
    const { report_period, zone_id, user_name } = req.body

    if (!report_period) {
      res.status(400).json({
        success: false,
        message: '报告月份为必填项，格式：YYYY-MM',
      })
      return
    }

    const zones = db.prepare(`
      SELECT id, name, area FROM farm_zones
      ${zone_id ? 'WHERE id = ?' : ''}
    `).all(zone_id ? Number(zone_id) : undefined)

    const startDate = `${report_period}-01`
    const endDate = `${report_period}-31`
    const reportDate = `${report_period}-01`

    const results: { zone_id: number; report_id: number | bigint }[] = []
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO water_reports 
      (report_type, report_period, report_date, zone_id, planned_water, actual_water, water_loss, deficit, completion_rate, irrigation_area, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)

    zones.forEach((zone: any) => {
      const zoneId = Number(zone.id)
      const monthlyRecords = db.prepare(`
        SELECT 
          COALESCE(SUM(planned_volume), 0) as planned_water,
          COALESCE(SUM(actual_volume), 0) as actual_water,
          COUNT(DISTINCT DATE(start_time)) as irrigation_days
        FROM irrigation_records
        WHERE zone_id = ? 
          AND DATE(start_time) BETWEEN ? AND ?
          AND status = 'completed'
      `).get(zoneId, startDate, endDate) as any

      const plannedWater = Number(monthlyRecords.planned_water) || 0
      const actualWater = Number(monthlyRecords.actual_water) || 0
      const waterLoss = plannedWater > 0 ? plannedWater - actualWater : 0
      const deficit = actualWater > 0 && plannedWater > actualWater ? plannedWater - actualWater : 0
      const completionRate = plannedWater > 0 ? Math.round((actualWater / plannedWater) * 10000) / 100 : 0

      const result = insertStmt.run(
        'monthly',
        report_period,
        reportDate,
        zoneId,
        plannedWater,
        actualWater,
        waterLoss,
        deficit,
        completionRate,
        Number(zone.area) || 0,
        `${zone.name} ${report_period} 用水月报`
      )

      results.push({ zone_id: zoneId, report_id: result.lastInsertRowid })
    })

    createLog(
      user_name || '系统',
      '用水报告',
      '生成月报',
      null,
      `生成${report_period}月报，共${zones.length}个灌区`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: results,
      message: `生成${report_period}月报成功`,
    })
  } catch (error) {
    console.error('Generate monthly report error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '生成月报失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      report_type, report_period, report_date, zone_id,
      planned_water, actual_water, water_loss, deficit,
      completion_rate, irrigation_area, description, user_name
    } = req.body

    if (!report_type || !report_period || !report_date) {
      res.status(400).json({
        success: false,
        message: '报告类型、报告周期、报告日期为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO water_reports 
      (report_type, report_period, report_date, zone_id, planned_water, actual_water, water_loss, deficit, completion_rate, irrigation_area, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      report_type,
      report_period,
      report_date,
      zone_id ? Number(zone_id) : null,
      Number(planned_water) || 0,
      Number(actual_water) || 0,
      Number(water_loss) || 0,
      Number(deficit) || 0,
      Number(completion_rate) || 0,
      Number(irrigation_area) || 0,
      description || ''
    )

    createLog(
      user_name || '系统',
      '用水报告',
      '新增',
      Number(result.lastInsertRowid),
      `新增${report_type}报告: ${report_period}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增报告成功',
    })
  } catch (error) {
    console.error('Create report error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增报告失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const {
      report_type, report_period, report_date, zone_id,
      planned_water, actual_water, water_loss, deficit,
      completion_rate, irrigation_area, description, user_name
    } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM water_reports WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '报告不存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE water_reports
      SET report_type = ?, report_period = ?, report_date = ?, zone_id = ?, planned_water = ?, actual_water = ?, water_loss = ?, deficit = ?, completion_rate = ?, irrigation_area = ?, description = ?
      WHERE id = ?
    `)
    updateStmt.run(
      report_type || existing.report_type,
      report_period || existing.report_period,
      report_date || existing.report_date,
      zone_id !== undefined ? Number(zone_id) : existing.zone_id,
      Number(planned_water) || existing.planned_water,
      Number(actual_water) || existing.actual_water,
      Number(water_loss) || existing.water_loss,
      Number(deficit) || existing.deficit,
      Number(completion_rate) || existing.completion_rate,
      Number(irrigation_area) || existing.irrigation_area,
      description !== undefined ? description : existing.description,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '用水报告',
      '更新',
      Number(id),
      `更新${report_type || existing.report_type}报告: ${report_period || existing.report_period}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新报告成功',
    })
  } catch (error) {
    console.error('Update report error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新报告失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM water_reports WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '报告不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM water_reports WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '用水报告',
      '删除',
      Number(id),
      `删除${existing.report_type}报告: ${existing.report_period}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除报告成功',
    })
  } catch (error) {
    console.error('Delete report error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除报告失败',
    })
  }
})

export default router
