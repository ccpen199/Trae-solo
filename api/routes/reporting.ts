import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

router.get('/metrics', (req: Request, res: Response): void => {
  try {
    const userCountStmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'")
    const { count: totalUsers } = userCountStmt.get() as { count: number }

    const meterStmt = db.prepare("SELECT COUNT(*) as count FROM meters WHERE status = 'normal'")
    const { count: totalMeters } = meterStmt.get() as { count: number }

    const todayReadingStmt = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(consumption), 0) as consumption
      FROM meter_readings 
      WHERE DATE(reading_date) = DATE('now', 'localtime')
    `)
    const todayReading = todayReadingStmt.get() as { count: number; consumption: number }

    const monthStmt = db.prepare(`
      SELECT COALESCE(SUM(consumption), 0) as consumption
      FROM meter_readings 
      WHERE strftime('%Y-%m', reading_date) = strftime('%Y-%m', 'now', 'localtime')
    `)
    const { consumption: monthConsumption } = monthStmt.get() as { consumption: number }

    const paymentStmt = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM bills 
      WHERE status = 'paid' AND strftime('%Y-%m', paid_date) = strftime('%Y-%m', 'now', 'localtime')
    `)
    const { total: monthPayment } = paymentStmt.get() as { total: number }

    const pendingOrderStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM work_orders 
      WHERE status IN ('pending', 'dispatched', 'in_progress')
    `)
    const { count: pendingOrders } = pendingOrderStmt.get() as { count: number }

    const completedOrderStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM work_orders 
      WHERE status IN ('completed', 'closed') 
      AND strftime('%Y-%m', completed_at) = strftime('%Y-%m', 'now', 'localtime')
    `)
    const { count: completedOrders } = completedOrderStmt.get() as { count: number }

    const activeWarningStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM warning_events 
      WHERE status = 'active'
    `)
    const { count: activeWarnings } = activeWarningStmt.get() as { count: number }

    const stationStmt = db.prepare('SELECT COUNT(*) as count FROM service_stations')
    const { count: totalStations } = stationStmt.get() as { count: number }

    const workerStmt = db.prepare("SELECT COUNT(*) as count FROM grid_workers WHERE status != 'idle'")
    const { count: onDutyWorkers } = workerStmt.get() as { count: number }

    const metrics = [
      { id: 'total_users', name: '用户总数', value: totalUsers, unit: '户', category: '用户服务' },
      { id: 'total_meters', name: '在用表具数', value: totalMeters, unit: '只', category: '设备设施' },
      { id: 'today_readings', name: '今日抄表数', value: todayReading.count, unit: '次', category: '抄表收费' },
      { id: 'today_consumption', name: '今日供气量', value: Math.round(todayReading.consumption * 100) / 100, unit: '立方米', category: '供气服务' },
      { id: 'month_consumption', name: '本月供气量', value: Math.round(monthConsumption * 100) / 100, unit: '立方米', category: '供气服务' },
      { id: 'month_payment', name: '本月收费金额', value: Math.round(monthPayment * 100) / 100, unit: '元', category: '抄表收费' },
      { id: 'pending_orders', name: '待处理工单', value: pendingOrders, unit: '件', category: '运维服务' },
      { id: 'completed_orders', name: '本月完成工单', value: completedOrders, unit: '件', category: '运维服务' },
      { id: 'active_warnings', name: '活跃预警数', value: activeWarnings, unit: '条', category: '安全监管' },
      { id: 'total_stations', name: '服务网点数', value: totalStations, unit: '个', category: '服务网点' },
      { id: 'onduty_workers', name: '在岗网格员', value: onDutyWorkers, unit: '人', category: '人员管理' },
    ]

    res.json({
      success: true,
      data: {
        metrics,
        report_date: new Date().toISOString().split('T')[0],
        category_summary: [
          { category: '用户服务', count: 1 },
          { category: '设备设施', count: 1 },
          { category: '抄表收费', count: 2 },
          { category: '供气服务', count: 2 },
          { category: '运维服务', count: 2 },
          { category: '安全监管', count: 1 },
          { category: '服务网点', count: 1 },
          { category: '人员管理', count: 1 },
        ],
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取报送指标失败',
    })
  }
})

router.post('/submit', (req: Request, res: Response): void => {
  try {
    const { report_type, metrics, platform } = req.body

    if (!report_type || !metrics) {
      res.status(400).json({
        success: false,
        error: '缺少参数',
      })
      return
    }

    const id = generateId('report')
    const now = new Date().toISOString().replace('T', ' ').split('.')[0]

    const insertStmt = db.prepare(`
      INSERT INTO reporting_logs (id, report_date, report_type, metrics, status, submitted_at, platform_response)
      VALUES (@id, @report_date, @report_type, @metrics, 'success', @submitted_at, @platform_response)
    `)
    insertStmt.run({
      id,
      report_date: new Date().toISOString().split('T')[0],
      report_type,
      metrics: JSON.stringify(metrics || {}),
      submitted_at: now,
      platform_response: JSON.stringify({
        platform: platform || 'city-platform',
        code: '200',
        message: '报送成功',
        receipt_no: `RCV${Date.now()}`,
      }),
    })

    const stmt = db.prepare('SELECT * FROM reporting_logs WHERE id = ?')
    const log = stmt.get(id)

    res.json({
      success: true,
      data: {
        id,
        report_type,
        status: 'success',
        submitted_at: now,
        receipt_no: `RCV${Date.now()}`,
        ...(log as Record<string, unknown>),
        metrics: JSON.parse((log as { metrics: string }).metrics),
        platform_response: JSON.parse((log as { platform_response: string }).platform_response),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '报送失败',
    })
  }
})

router.get('/logs', (req: Request, res: Response): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const reportType = req.query.reportType as string
    const status = req.query.status as string

    const offset = (page - 1) * pageSize

    const whereClauses: string[] = []
    const params: Record<string, unknown> = {}

    if (reportType) {
      whereClauses.push('report_type = @reportType')
      params.reportType = reportType
    }
    if (status) {
      whereClauses.push('status = @status')
      params.status = status
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM reporting_logs ${whereClause}`)
    const { total } = countStmt.get(params) as { total: number }

    const listStmt = db.prepare(`
      SELECT * FROM reporting_logs
      ${whereClause}
      ORDER BY submitted_at DESC
      LIMIT @limit OFFSET @offset
    `)
    const logs = listStmt.all({ ...params, limit: pageSize, offset }).map((item: { metrics: string; platform_response: string | null }) => ({
      ...item,
      metrics: JSON.parse(item.metrics),
      platform_response: item.platform_response ? JSON.parse(item.platform_response) : null,
    }))

    res.json({
      success: true,
      data: {
        list: logs,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取报送记录失败',
    })
  }
})

export default router
