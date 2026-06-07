import { Router, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateTokenOrDemo, AuthRequest } from '../middleware/auth.js'

const router = Router()

function scalar(sql: string, params: unknown[] = []) {
  const row = db.prepare(sql).get(...params) as { value?: number } | undefined
  return Number(row?.value || 0)
}

function buildAdminStats() {
  const totalProperties = scalar("SELECT COUNT(*) AS value FROM properties WHERE status = 'active'")
  const totalOwners = scalar('SELECT COUNT(*) AS value FROM owners')
  const totalUsers = scalar("SELECT COUNT(*) AS value FROM users WHERE is_active = 1")
  const openOrders = scalar("SELECT COUNT(*) AS value FROM mall_orders WHERE status IN ('pending', 'confirmed', 'processing')")
  const pendingTaxReturns = scalar("SELECT COUNT(*) AS value FROM tax_returns WHERE status IN ('pending', 'in_progress')")
  const assetValue = scalar("SELECT COALESCE(SUM(current_value), 0) AS value FROM properties WHERE status = 'active'")
  const annualRent = scalar("SELECT COALESCE(SUM(amount), 0) AS value FROM rent_payments WHERE status = 'paid' AND payment_date >= date('now', '-12 months')")
  const annualExpenses = scalar("SELECT COALESCE(SUM(amount), 0) AS value FROM expenses WHERE expense_date >= date('now', '-12 months')")

  return {
    total_properties: totalProperties,
    total_owners: totalOwners,
    total_users: totalUsers,
    open_orders: openOrders,
    pending_tax_returns: pendingTaxReturns,
    asset_value: assetValue,
    annual_rent: annualRent,
    annual_expenses: annualExpenses,
    net_income: annualRent - annualExpenses,
  }
}

router.get('/stats', authenticateTokenOrDemo, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: buildAdminStats(),
    })
  } catch (e) {
    next(e)
  }
})

router.get('/dashboard', authenticateTokenOrDemo, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recentOrders = db.prepare(`
      SELECT id, order_no, order_type, total_amount, currency, payment_status, status, ordered_at, created_at
      FROM mall_orders
      ORDER BY COALESCE(ordered_at, created_at) DESC
      LIMIT 8
    `).all()

    const usersByRole = db.prepare(`
      SELECT role, COUNT(*) AS count
      FROM users
      WHERE is_active = 1
      GROUP BY role
      ORDER BY role
    `).all()

    const latestActivity = db.prepare(`
      SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at, u.full_name AS user_name
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all()

    res.json({
      success: true,
      data: {
        stats: buildAdminStats(),
        users_by_role: usersByRole,
        recent_orders: recentOrders,
        latest_activity: latestActivity,
      },
    })
  } catch (e) {
    next(e)
  }
})

export default router
