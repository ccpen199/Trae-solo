import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from './auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const userStats = db.prepare(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN customer_type = 'individual' THEN 1 ELSE 0 END) as individual_count,
        SUM(CASE WHEN customer_type = 'family' THEN 1 ELSE 0 END) as family_count,
        SUM(CASE WHEN customer_type = 'enterprise' THEN 1 ELSE 0 END) as enterprise_count,
        SUM(CASE WHEN customer_type = 'park' THEN 1 ELSE 0 END) as park_count,
        SUM(points_balance) as total_points
      FROM users
    `).get()

    const billStats = db.prepare(`
      SELECT
        COUNT(*) as total_bills,
        SUM(total_kwh) as total_kwh,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_revenue,
        SUM(CASE WHEN status = 'unpaid' THEN total_amount ELSE 0 END) as unpaid_revenue,
        SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as overdue_revenue
      FROM electricity_bills
    `).get()

    const energyStats = db.prepare(`
      SELECT
        SUM(total_consumption_kwh) as total_report_kwh,
        AVG(efficiency_score) as avg_efficiency_score
      FROM energy_reports
    `).get()

    const deviceStats = db.prepare(`
      SELECT
        COUNT(*) as total_devices,
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_devices,
        SUM(power_consumption) as total_power
      FROM smart_devices
    `).get()

    const subsidyStats = db.prepare(`
      SELECT
        COUNT(*) as total_subsidies,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_subsidies,
        SUM(CASE WHEN status = 'disbursed' THEN amount ELSE 0 END) as disbursed_subsidies
      FROM subsidies
    `).get()

    const mallStats = db.prepare(`
      SELECT
        COUNT(*) as total_items,
        SUM(stock) as total_stock
      FROM mall_items
    `).get()

    const latestUsers = db.prepare(`
      SELECT id, username, real_name, customer_type, created_at
      FROM users ORDER BY created_at DESC LIMIT 5
    `).all()

    const latestBills = db.prepare(`
      SELECT eb.*, u.username, u.real_name
      FROM electricity_bills eb JOIN users u ON eb.user_id = u.id
      ORDER BY eb.created_at DESC LIMIT 5
    `).all()

    res.json({
      success: true,
      data: {
        users: userStats,
        bills: billStats,
        energy: energyStats,
        devices: deviceStats,
        subsidies: subsidyStats,
        mall: mallStats,
        latestUsers,
        latestBills,
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
    const bills = db.prepare('SELECT COUNT(*) as count, SUM(total_amount) as amount FROM electricity_bills').get() as any
    const devices = db.prepare('SELECT COUNT(*) as count FROM smart_devices').get() as any
    const latestBills = db.prepare(`
      SELECT eb.id, eb.billing_period, eb.total_amount, eb.status, u.username, u.real_name
      FROM electricity_bills eb JOIN users u ON eb.user_id = u.id
      ORDER BY eb.created_at DESC LIMIT 6
    `).all()

    res.json({
      success: true,
      data: {
        service: 'csg-energy-admin-dashboard',
        stats: {
          userCount: Number(users?.count || 0),
          billCount: Number(bills?.count || 0),
          billAmount: Number(bills?.amount || 0),
          deviceCount: Number(devices?.count || 0),
        },
        latestBills,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer_type, status, keyword } = req.query

    let sql = `
      SELECT u.*,
        (SELECT SUM(total_amount) FROM electricity_bills WHERE user_id = u.id) as total_spent,
        (SELECT COUNT(*) FROM electricity_bills WHERE user_id = u.id AND status = 'unpaid') as unpaid_count
      FROM users u WHERE 1=1
    `
    const params: any[] = []

    if (customer_type) { sql += ' AND u.customer_type = ?'; params.push(customer_type as string) }
    if (keyword) {
      sql += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ? OR u.company_name LIKE ?)'
      const kw = `%${keyword}%`
      params.push(kw, kw, kw, kw, kw)
    }

    sql += ' ORDER BY u.created_at DESC LIMIT 50'
    const users = db.prepare(sql).all(...params)
    res.json({ success: true, data: users })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/health-check', async (req: Request, res: Response): Promise<void> => {
  try {
    let dbStatus = 'healthy'
    let dbVersion = null
    try {
      dbVersion = db.prepare('SELECT sqlite_version() as version').get() as any
      const journalMode = db.prepare('PRAGMA journal_mode').get() as any
      db.pragma('foreign_keys = ON')
    } catch {
      dbStatus = 'unhealthy'
    }

    const dbSize = await import('fs').then(fs => {
      try {
        const stats = fs.statSync(db.pragma('database_list')[0].file)
        return (stats.size / 1024 / 1024).toFixed(2) + ' MB'
      } catch {
        return 'unknown'
      }
    })

    const dbList = db.pragma('database_list')
    const tableStats = db.prepare(`
      SELECT
        name as table_name,
        (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name = sm.name) as index_count
      FROM sqlite_master sm WHERE type='table' ORDER BY name
    `).all() as any[]

    const tableCounts = tableStats.map(t => {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.table_name}`).get() as any
      return { ...t, row_count: count.count }
    })

    const uptime = process.uptime()

    res.json({
      success: true,
      data: {
        server: {
          status: 'healthy',
          uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
          node_version: process.version,
          platform: process.platform,
        },
        database: {
          status: dbStatus,
          version: dbVersion?.version || null,
          size: dbSize,
          location: dbList[0]?.file || null,
          tables: tableCounts,
        },
        routes: [
          { path: '/api/auth', status: 'ok' },
          { path: '/api/electricity', status: 'ok' },
          { path: '/api/energy', status: 'ok' },
          { path: '/api/smartlife', status: 'ok' },
          { path: '/api/knowledge', status: 'ok' },
          { path: '/api/compliance', status: 'ok' },
          { path: '/api/admin', status: 'ok' },
        ],
        memory: {
          rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
          heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
          heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
        },
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
