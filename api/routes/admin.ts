import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'
import { getDb } from '../database.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/dashboard', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const totalPackages = db.prepare('SELECT COUNT(*) as count FROM packages').get() as { count: number }
    const storedPackages = db.prepare("SELECT COUNT(*) as count FROM packages WHERE status = 'stored'").get() as { count: number }
    const pickedUpPackages = db.prepare("SELECT COUNT(*) as count FROM packages WHERE status = 'picked_up'").get() as { count: number }

    const compartmentStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied
      FROM compartments
    `).get() as { total: number; available: number; occupied: number }
    const occupancyRate = compartmentStats.total > 0
      ? Math.round((compartmentStats.occupied / compartmentStats.total) * 10000) / 100
      : 0

    const activeLaundryOrders = db.prepare("SELECT COUNT(*) as count FROM laundry_orders WHERE status NOT IN ('delivered')").get() as { count: number }
    const activeHousekeepingOrders = db.prepare("SELECT COUNT(*) as count FROM housekeeping_orders WHERE status NOT IN ('completed', 'cancelled')").get() as { count: number }
    const activeShippingOrders = db.prepare("SELECT COUNT(*) as count FROM shipping_orders WHERE status NOT IN ('delivered', 'stored_in_cabinet')").get() as { count: number }

    const storageRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM storage_billings WHERE status = 'settled'").get() as { total: number }
    const laundryRevenue = db.prepare("SELECT COALESCE(SUM(final_price), 0) as total FROM laundry_orders WHERE status = 'delivered'").get() as { total: number }
    const housekeepingRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM housekeeping_orders WHERE status = 'completed'").get() as { total: number }
    const shippingRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM shipping_orders WHERE status IN ('delivered', 'stored_in_cabinet')").get() as { total: number }

    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as { count: number }
    const totalCabinets = db.prepare('SELECT COUNT(*) as count FROM cabinets').get() as { count: number }

    const unresolvedAlerts = db.prepare("SELECT COUNT(*) as count FROM cabinet_alerts WHERE is_resolved = 0").get() as { count: number }

    res.json({
      success: true,
      data: {
        packages: {
          total: totalPackages.count,
          stored: storedPackages.count,
          picked_up: pickedUpPackages.count,
        },
        compartments: {
          total: compartmentStats.total,
          available: compartmentStats.available,
          occupied: compartmentStats.occupied,
          occupancy_rate: occupancyRate,
        },
        active_orders: {
          laundry: activeLaundryOrders.count,
          housekeeping: activeHousekeepingOrders.count,
          shipping: activeShippingOrders.count,
        },
        revenue: {
          storage: storageRevenue.total,
          laundry: laundryRevenue.total,
          housekeeping: housekeepingRevenue.total,
          shipping: shippingRevenue.total,
          total: storageRevenue.total + laundryRevenue.total + housekeepingRevenue.total + shippingRevenue.total,
        },
        users: { total: totalUsers.count },
        cabinets: { total: totalCabinets.count },
        unresolved_alerts: unresolvedAlerts.count,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ success: false, error: '获取仪表盘数据失败' })
  }
})

router.get('/cabinet-monitor', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const cabinets = db.prepare(`
      SELECT c.*,
        COUNT(cmp.id) as total_compartments,
        SUM(CASE WHEN cmp.status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN cmp.status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN cmp.status = 'reserved' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN cmp.status = 'fault' THEN 1 ELSE 0 END) as fault_count
      FROM cabinets c
      LEFT JOIN compartments cmp ON cmp.cabinet_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `).all() as Array<Record<string, unknown>>

    const cabinetsWithRate = cabinets.map(c => ({
      ...c,
      occupancy_rate: (c.total_compartments as number) > 0
        ? Math.round(((c.occupied as number) / (c.total_compartments as number)) * 10000) / 100
        : 0,
    }))

    const faultAlerts = db.prepare(`
      SELECT ca.*, c.name as cabinet_name
      FROM cabinet_alerts ca
      LEFT JOIN cabinets c ON ca.cabinet_id = c.id
      WHERE ca.type = 'fault' AND ca.is_resolved = 0
      ORDER BY ca.severity DESC, ca.created_at DESC
    `).all()

    const restockAlerts = db.prepare(`
      SELECT ca.*, c.name as cabinet_name
      FROM cabinet_alerts ca
      LEFT JOIN cabinets c ON ca.cabinet_id = c.id
      WHERE ca.type = 'restock' AND ca.is_resolved = 0
      ORDER BY ca.created_at DESC
    `).all()

    const overduePackages = db.prepare(`
      SELECT p.*, cmp.code as compartment_code, c.name as cabinet_name
      FROM packages p
      LEFT JOIN compartments cmp ON p.compartment_id = cmp.id
      LEFT JOIN cabinets c ON cmp.cabinet_id = c.id
      WHERE p.status = 'stored' AND p.expiry_at < datetime('now', 'localtime')
      ORDER BY p.expiry_at ASC
    `).all()

    res.json({
      success: true,
      data: {
        cabinets: cabinetsWithRate,
        fault_alerts: faultAlerts,
        restock_alerts: restockAlerts,
        overdue_packages: overduePackages,
      },
    })
  } catch (error) {
    console.error('Cabinet monitor error:', error)
    res.status(500).json({ success: false, error: '获取柜子监控数据失败' })
  }
})

router.get('/quality-board', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const avgDeliveryTime = db.prepare(`
      SELECT AVG(
        JULIANDAY(picked_up_at) - JULIANDAY(stored_at)
      ) * 24 as avg_hours
      FROM packages WHERE status = 'picked_up' AND stored_at IS NOT NULL AND picked_up_at IS NOT NULL
    `).get() as { avg_hours: number | null }

    const totalReviews = db.prepare('SELECT COUNT(*) as count FROM service_reviews').get() as { count: number }
    const avgRating = db.prepare('SELECT AVG(rating) as avg FROM service_reviews').get() as { avg: number | null }

    const lowRatingReviews = db.prepare('SELECT COUNT(*) as count FROM service_reviews WHERE rating <= 2').get() as { count: number }
    const complaintRate = totalReviews.count > 0
      ? Math.round((lowRatingReviews.count / totalReviews.count) * 10000) / 100
      : 0

    const totalUsers = db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM packages").get() as { count: number }
    const repeatUsers = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT user_id FROM packages GROUP BY user_id HAVING COUNT(*) > 1
      )
    `).get() as { count: number }
    const repurchaseRate = totalUsers.count > 0
      ? Math.round((repeatUsers.count / totalUsers.count) * 10000) / 100
      : 0

    const laundryCompleted = db.prepare("SELECT COUNT(*) as count FROM laundry_orders WHERE status = 'delivered'").get() as { count: number }
    const laundryAvgTime = db.prepare(`
      SELECT AVG(JULIANDAY(updated_at) - JULIANDAY(created_at)) * 24 as avg_hours
      FROM laundry_orders WHERE status = 'delivered'
    `).get() as { avg_hours: number | null }

    const housekeepingCompleted = db.prepare("SELECT COUNT(*) as count FROM housekeeping_orders WHERE status = 'completed'").get() as { count: number }
    const housekeepingAvgRating = db.prepare('SELECT AVG(review_score) as avg FROM housekeeping_orders WHERE review_score IS NOT NULL').get() as { avg: number | null }

    res.json({
      success: true,
      data: {
        package_delivery: {
          avg_delivery_hours: avgDeliveryTime.avg_hours ? Math.round(avgDeliveryTime.avg_hours * 100) / 100 : 0,
        },
        service_reviews: {
          total: totalReviews.count,
          avg_rating: avgRating.avg ? Math.round(avgRating.avg * 100) / 100 : 0,
          complaint_rate: complaintRate,
        },
        user_metrics: {
          total_users: totalUsers.count,
          repeat_users: repeatUsers.count,
          repurchase_rate: repurchaseRate,
        },
        laundry: {
          completed: laundryCompleted.count,
          avg_processing_hours: laundryAvgTime.avg_hours ? Math.round(laundryAvgTime.avg_hours * 100) / 100 : 0,
        },
        housekeeping: {
          completed: housekeepingCompleted.count,
          avg_rating: housekeepingAvgRating.avg ? Math.round(housekeepingAvgRating.avg * 100) / 100 : 0,
        },
      },
    })
  } catch (error) {
    console.error('Quality board error:', error)
    res.status(500).json({ success: false, error: '获取服务质量数据失败' })
  }
})

router.get('/cross-recommend', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const storageUsers = db.prepare(`
      SELECT DISTINCT user_id FROM storage_billings WHERE status IN ('active', 'settled')
    `).all() as Array<{ user_id: string }>

    const storageUserIds = storageUsers.map(u => u.user_id)
    const laundryUsers = db.prepare(`
      SELECT DISTINCT user_id FROM laundry_orders
    `).all() as Array<{ user_id: string }>
    const laundryUserIds = new Set(laundryUsers.map(u => u.user_id))

    const storageToLaundry = storageUserIds.filter(id => !laundryUserIds.has(id))

    const laundryCoupons = db.prepare(`
      SELECT * FROM coupons WHERE type = 'laundry_discount' AND is_active = 1 AND used_count < usage_limit
      AND valid_to > datetime('now', 'localtime')
    `).all()

    const housekeepingUsers = db.prepare(`
      SELECT DISTINCT user_id FROM housekeeping_orders
    `).all() as Array<{ user_id: string }>
    const housekeepingUserIds = new Set(housekeepingUsers.map(u => u.user_id))

    const allUserIds = new Set([...storageUserIds, ...laundryUserIds, ...housekeepingUserIds])
    const nonHousekeepingUsers = [...allUserIds].filter(id => !housekeepingUserIds.has(id))

    const housekeepingCoupons = db.prepare(`
      SELECT * FROM coupons WHERE type = 'housekeeping_discount' AND is_active = 1 AND used_count < usage_limit
      AND valid_to > datetime('now', 'localtime')
    `).all()

    const shippingCoupons = db.prepare(`
      SELECT * FROM coupons WHERE type = 'shipping_discount' AND is_active = 1 AND used_count < usage_limit
      AND valid_to > datetime('now', 'localtime')
    `).all()

    const recommendations: Array<Record<string, unknown>> = []

    if (storageToLaundry.length > 0 && laundryCoupons.length > 0) {
      recommendations.push({
        type: 'storage_to_laundry',
        title: '存储用户推荐洗衣服务',
        description: `${storageToLaundry.length}位存储用户尚未使用洗衣服务，可推送洗衣优惠券`,
        target_user_count: storageToLaundry.length,
        available_coupons: laundryCoupons,
        coupon_id: (laundryCoupons[0] as Record<string, unknown>)?.id,
      })
    }

    if (nonHousekeepingUsers.length > 0 && housekeepingCoupons.length > 0) {
      recommendations.push({
        type: 'cross_housekeeping',
        title: '跨界推荐家政服务',
        description: `${nonHousekeepingUsers.length}位活跃用户尚未使用家政服务`,
        target_user_count: nonHousekeepingUsers.length,
        available_coupons: housekeepingCoupons,
        coupon_id: (housekeepingCoupons[0] as Record<string, unknown>)?.id,
      })
    }

    const highFrequencyUsers = db.prepare(`
      SELECT user_id, COUNT(*) as order_count
      FROM (
        SELECT user_id, id FROM packages
        UNION ALL
        SELECT user_id, id FROM laundry_orders
        UNION ALL
        SELECT user_id, id FROM housekeeping_orders
      )
      GROUP BY user_id
      HAVING order_count >= 3
      ORDER BY order_count DESC
    `).all() as Array<{ user_id: string; order_count: number }>

    if (highFrequencyUsers.length > 0 && shippingCoupons.length > 0) {
      recommendations.push({
        type: 'high_frequency_shipping',
        title: '高频用户推荐寄件服务',
        description: `${highFrequencyUsers.length}位高频用户可推荐寄件优惠`,
        target_user_count: highFrequencyUsers.length,
        available_coupons: shippingCoupons,
        coupon_id: (shippingCoupons[0] as Record<string, unknown>)?.id,
      })
    }

    res.json({ success: true, data: recommendations })
  } catch (error) {
    console.error('Cross recommend error:', error)
    res.status(500).json({ success: false, error: '获取跨界推荐数据失败' })
  }
})

router.post('/alert/:id/resolve', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const alert = db.prepare('SELECT * FROM cabinet_alerts WHERE id = ?').get(req.params.id)
    if (!alert) {
      res.status(404).json({ success: false, error: '告警不存在' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    db.prepare('UPDATE cabinet_alerts SET is_resolved = 1, resolved_at = ? WHERE id = ?').run(now, req.params.id)

    const updated = db.prepare(`
      SELECT ca.*, c.name as cabinet_name
      FROM cabinet_alerts ca
      LEFT JOIN cabinets c ON ca.cabinet_id = c.id
      WHERE ca.id = ?
    `).get(req.params.id)

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Resolve alert error:', error)
    res.status(500).json({ success: false, error: '解决告警失败' })
  }
})

router.get('/alerts', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const alerts = db.prepare(`
      SELECT ca.*, c.name as cabinet_name
      FROM cabinet_alerts ca
      LEFT JOIN cabinets c ON ca.cabinet_id = c.id
      WHERE ca.is_resolved = 0
      ORDER BY
        CASE ca.severity
          WHEN 'critical' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
        END DESC,
        ca.created_at DESC
    `).all()

    res.json({ success: true, data: alerts })
  } catch (error) {
    console.error('List alerts error:', error)
    res.status(500).json({ success: false, error: '获取告警列表失败' })
  }
})

export default router
