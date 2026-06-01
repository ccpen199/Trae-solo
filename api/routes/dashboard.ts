import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/stats', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const totalSites = (db.prepare('SELECT COUNT(*) as count FROM sites').get() as { count: number }).count
    const totalDevices = (db.prepare('SELECT COUNT(*) as count FROM devices').get() as { count: number }).count
    const onlineDevices = (db.prepare('SELECT COUNT(*) as count FROM devices WHERE online = 1').get() as { count: number }).count
    const todayOrders = (db.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE('now')",
    ).get() as { count: number }).count
    const todayRevenue = (db.prepare(
      "SELECT COALESCE(SUM(rr.platform_share) - SUM(rr.electricity_cost), 0) as total FROM revenue_records rr JOIN orders o ON rr.order_id = o.id WHERE DATE(rr.created_at) = DATE('now')",
    ).get() as { total: number }).total
    const pendingWorkOrders = (db.prepare(
      "SELECT COUNT(*) as count FROM work_orders WHERE status IN ('pending', 'assigned')",
    ).get() as { count: number }).count
    const pendingWORaw = db.prepare(
      `SELECT wo.*, 
        d.name as device_name, 
        s.name as site_name,
        (SELECT COUNT(*) FROM work_order_photos wop WHERE wop.work_order_id = wo.id) as photo_count,
        CASE WHEN wo.assigned_at IS NOT NULL THEN 
          CAST((julianday(wo.assigned_at) - julianday(wo.created_at)) * 24 * 60 AS INTEGER)
        ELSE NULL END as first_response_minutes
      FROM work_orders wo 
      LEFT JOIN devices d ON wo.device_id = d.id 
      LEFT JOIN sites s ON wo.site_id = s.id 
      WHERE wo.status IN ('pending', 'assigned') 
      ORDER BY wo.created_at DESC LIMIT 10`,
    ).all()
    const pendingWorkOrdersList = pendingWORaw.map((wo: any) => ({
      ...wo,
      has_complaint: wo.type === 'complaint',
    }))
    const recentOrdersRaw = db.prepare(
      'SELECT o.*, s.electricity_price, s.service_fee, d.name as device_name, s.name as site_name FROM orders o LEFT JOIN devices d ON o.device_id = d.id LEFT JOIN sites s ON o.site_id = s.id ORDER BY o.created_at DESC LIMIT 5',
    ).all()
    const recentOrders = recentOrdersRaw.map((o: any) => ({
      ...o,
      scan_time: o.start_time,
      charge_start_time: o.start_time,
      fee_breakdown: {
        electricity_cost: Math.round(o.energy * o.electricity_price * 100) / 100,
        service_cost: Math.round(o.energy * o.service_fee * 100) / 100,
        total_cost: o.cost,
      },
    }))
    const alertDevicesRaw = db.prepare(`
      SELECT 
        d.*,
        s.name as site_name,
        (SELECT id FROM work_orders wo WHERE wo.device_id = d.id AND wo.status IN ('pending','assigned') ORDER BY wo.created_at DESC LIMIT 1) as related_work_order_id,
        (SELECT status FROM work_orders wo WHERE wo.device_id = d.id AND wo.status IN ('pending','assigned') ORDER BY wo.created_at DESC LIMIT 1) as work_order_status
      FROM devices d
      LEFT JOIN sites s ON d.site_id = s.id
      WHERE d.online = 0 OR d.fault_code IS NOT NULL
      ORDER BY d.last_heartbeat ASC
    `).all()
    const alertDevices = alertDevicesRaw.map((d: any) => ({
      ...d,
      ports: db.prepare('SELECT * FROM device_ports WHERE device_id = ?').all(d.id),
    }))

    res.json({
      success: true,
      data: {
        total_sites: totalSites,
        total_devices: totalDevices,
        online_devices: onlineDevices,
        today_orders: todayOrders,
        today_revenue: Math.round(todayRevenue * 100) / 100,
        pending_work_orders: pendingWorkOrders,
        pending_work_orders_list: pendingWorkOrdersList,
        recent_orders: recentOrders,
        alert_devices: alertDevices,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
