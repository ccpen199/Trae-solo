import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/stats', (req: Request, res: Response): void => {
  try {
    const userCountStmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'")
    const { count: userCount } = userCountStmt.get() as { count: number }

    const todayReadingStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM meter_readings 
      WHERE DATE(reading_date) = DATE('now', 'localtime')
    `)
    const { count: todayReadings } = todayReadingStmt.get() as { count: number }

    const paymentStmt = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM bills 
      WHERE status = 'paid'
    `)
    const { total: totalPayment } = paymentStmt.get() as { total: number }

    const pendingOrderStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM work_orders 
      WHERE status IN ('pending', 'dispatched', 'in_progress')
    `)
    const { count: pendingOrders } = pendingOrderStmt.get() as { count: number }

    const activeWarningStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM warning_events 
      WHERE status = 'active'
    `)
    const { count: activeWarnings } = activeWarningStmt.get() as { count: number }

    const meterStmt = db.prepare("SELECT COUNT(*) as count FROM meters WHERE status = 'normal'")
    const { count: meterCount } = meterStmt.get() as { count: number }

    const unpaidStmt = db.prepare("SELECT COUNT(*) as count FROM bills WHERE status = 'unpaid'")
    const { count: unpaidBills } = unpaidStmt.get() as { count: number }

    const todayOrderStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM work_orders 
      WHERE DATE(created_at) = DATE('now', 'localtime')
    `)
    const { count: todayOrders } = todayOrderStmt.get() as { count: number }

    res.json({
      success: true,
      data: {
        total_users: userCount,
        today_readings: todayReadings,
        total_payment: Math.round(totalPayment * 100) / 100,
        pending_orders: pendingOrders,
        active_warnings: activeWarnings,
        active_meters: meterCount,
        unpaid_bills: unpaidBills,
        today_orders: todayOrders,
        updated_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取统计数据失败',
    })
  }
})

router.get('/trends', (req: Request, res: Response): void => {
  try {
    const days = 30

    const readingsTrend: Array<{ date: string; count: number; consumption: number }> = []
    const ordersTrend: Array<{ date: string; count: number }> = []
    const paymentsTrend: Array<{ date: string; amount: number }> = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const readingStmt = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(consumption), 0) as consumption
        FROM meter_readings 
        WHERE DATE(reading_date) = ?
      `)
      const readingData = readingStmt.get(dateStr) as { count: number; consumption: number }
      readingsTrend.push({
        date: dateStr,
        count: readingData.count,
        consumption: Math.round(readingData.consumption * 100) / 100,
      })

      const orderStmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM work_orders 
        WHERE DATE(created_at) = ?
      `)
      const orderData = orderStmt.get(dateStr) as { count: number }
      ordersTrend.push({
        date: dateStr,
        count: orderData.count,
      })

      const paymentStmt = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as amount
        FROM bills 
        WHERE status = 'paid' AND DATE(paid_date) = ?
      `)
      const paymentData = paymentStmt.get(dateStr) as { amount: number }
      paymentsTrend.push({
        date: dateStr,
        amount: Math.round(paymentData.amount * 100) / 100,
      })
    }

    res.json({
      success: true,
      data: {
        days,
        readings: readingsTrend,
        orders: ordersTrend,
        payments: paymentsTrend,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取趋势数据失败',
    })
  }
})

router.get('/warnings-stream', (req: Request, res: Response): void => {
  try {
    const limit = parseInt(req.query.limit as string) || 10

    const stmt = db.prepare(`
      SELECT w.*, u.name as user_name, u.account_no, u.address
      FROM warning_events w
      LEFT JOIN users u ON w.user_id = u.id
      ORDER BY w.detected_at DESC
      LIMIT ?
    `)
    const warnings = stmt.all(limit)

    res.json({
      success: true,
      data: warnings,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取预警流失败',
    })
  }
})

export default router
