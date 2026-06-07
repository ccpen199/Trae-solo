import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateTokenOrDemo, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/summary', authenticateTokenOrDemo, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const totalProperties = (db.prepare('SELECT COUNT(*) as count FROM properties WHERE status = ?').get('active') as { count: number }).count
    
    const totalValue = (db.prepare('SELECT SUM(current_value) as total FROM properties WHERE status = ?').get('active') as { total: number }).total || 0
    
    const activeLeases = (db.prepare('SELECT COUNT(*) as count FROM lease_agreements WHERE status = ?').get('active') as { count: number }).count
    
    const totalRentalIncome = (db.prepare(`
      SELECT SUM(amount) as total 
      FROM rent_payments 
      WHERE status = 'paid' AND payment_date >= date('now', '-12 months')
    `).get() as { total: number }).total || 0
    
    const totalExpenses = (db.prepare(`
      SELECT SUM(amount) as total 
      FROM expenses 
      WHERE expense_date >= date('now', '-12 months')
    `).get() as { total: number }).total || 0
    
    const totalLoanBalance = (db.prepare(`
      SELECT SUM(remaining_balance) as total 
      FROM loan_contracts 
      WHERE status = 'active'
    `).get() as { total: number }).total || 0
    
    const vacantProperties = (db.prepare(`
      SELECT COUNT(*) as count 
      FROM properties 
      WHERE status = 'active' 
      AND id NOT IN (SELECT property_id FROM lease_agreements WHERE status = 'active')
    `).get() as { count: number }).count
    
    const vacancyRate = totalProperties > 0 ? vacantProperties / totalProperties : 0
    
    const annualYield = totalValue > 0 ? (totalRentalIncome - totalExpenses) / totalValue : 0
    
    const upcomingRepayments = (db.prepare(`
      SELECT COUNT(*) as count 
      FROM loan_contracts 
      WHERE status = 'active' 
      AND next_repayment_date BETWEEN date('now') AND date('now', '+30 days')
    `).get() as { count: number }).count
    
    const upcomingLeaseExpiries = (db.prepare(`
      SELECT COUNT(*) as count 
      FROM lease_agreements 
      WHERE status = 'active' 
      AND end_date BETWEEN date('now') AND date('now', '+90 days')
    `).get() as { count: number }).count
    
    const pendingTaxReturns = (db.prepare(`
      SELECT COUNT(*) as count 
      FROM tax_returns 
      WHERE status IN ('pending', 'in_progress')
    `).get() as { count: number }).count
    
    const pendingPayments = (db.prepare(`
      SELECT COUNT(*) as count 
      FROM rent_payments 
      WHERE status IN ('pending', 'overdue')
    `).get() as { count: number }).count
    
    const activeOwners = (db.prepare('SELECT COUNT(*) as count FROM owners').get() as { count: number }).count
    const activeTenants = (db.prepare('SELECT COUNT(*) as count FROM tenants WHERE status = ?').get('active') as { count: number }).count
    
    res.json({
      success: true,
      data: {
        total_properties: totalProperties,
        total_value: totalValue,
        total_property_value: totalValue,
        active_leases: activeLeases,
        vacant_properties: vacantProperties,
        vacancy_rate: Math.round(vacancyRate * 10000) / 10000,
        vacancy_rate_percent: Math.round(vacancyRate * 10000) / 100,
        annual_yield: Math.round(annualYield * 10000) / 10000,
        annual_yield_percent: Math.round(annualYield * 10000) / 100,
        total_rental_income: totalRentalIncome,
        total_expenses: totalExpenses,
        total_operating_expenses: totalExpenses,
        net_income: totalRentalIncome - totalExpenses,
        total_loan_balance: totalLoanBalance,
        upcoming_repayments: upcomingRepayments,
        upcoming_lease_expiries: upcomingLeaseExpiries,
        pending_tax_returns: pendingTaxReturns,
        pending_payments: pendingPayments,
        active_owners: activeOwners,
        active_tenants: activeTenants,
      }
    })
  } catch (e) {
    next(e)
  }
})

router.get('/rental-income-chart', authenticateTokenOrDemo, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { months = 12 } = req.query
    const numMonths = parseInt(months as string)
    
    const rentalData = db.prepare(`
      SELECT 
        strftime('%Y-%m', payment_date) as month,
        SUM(amount) as income
      FROM rent_payments 
      WHERE status = 'paid' 
      AND payment_date >= date('now', ?)
      GROUP BY strftime('%Y-%m', payment_date)
      ORDER BY month
    `).all(`-${numMonths} months`) as any[]
    
    const expenseData = db.prepare(`
      SELECT 
        strftime('%Y-%m', expense_date) as month,
        SUM(amount) as expenses
      FROM expenses 
      WHERE expense_date >= date('now', ?)
      GROUP BY strftime('%Y-%m', expense_date)
      ORDER BY month
    `).all(`-${numMonths} months`) as any[]
    
    const result: any[] = []
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      
      const rental = rentalData.find((r: any) => r.month === month)
      const expense = expenseData.find((e: any) => e.month === month)
      
      result.push({
        month,
        income: rental?.income || 0,
        rental_income: rental?.income || 0,
        expenses: expense?.expenses || 0,
        net_income: (rental?.income || 0) - (expense?.expenses || 0)
      })
    }
    
    res.json({
      success: true,
      data: result
    })
  } catch (e) {
    next(e)
  }
})

router.get('/vacancy-rate-chart', authenticateTokenOrDemo, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const propertiesByCity = db.prepare(`
      SELECT 
        city,
        COUNT(*) as total,
        SUM(CASE WHEN id IN (SELECT property_id FROM lease_agreements WHERE status = 'active') THEN 1 ELSE 0 END) as occupied
      FROM properties 
      WHERE status = 'active'
      GROUP BY city
    `).all() as any[]
    
    const result = propertiesByCity.map((row: any) => ({
      city: row.city,
      count: row.total,
      total_properties: row.total,
      occupied: row.occupied,
      vacant: row.total - row.occupied,
      rate: row.total > 0 ? Math.round(((row.total - row.occupied) / row.total) * 10000) / 10000 : 0,
      vacancy_rate: row.total > 0 ? Math.round(((row.total - row.occupied) / row.total) * 10000) / 100 : 0
    }))
    
    res.json({
      success: true,
      data: result
    })
  } catch (e) {
    next(e)
  }
})

router.get('/expense-breakdown', authenticateTokenOrDemo, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { months = 12 } = req.query
    
    const expenseData = db.prepare(`
      SELECT 
        expense_type,
        SUM(amount) as total
      FROM expenses 
      WHERE expense_date >= date('now', ?)
      GROUP BY expense_type
      ORDER BY total DESC
    `).all(`-${months} months`) as any[]
    
    const grandTotal = expenseData.reduce((sum: number, row: any) => sum + (row.total || 0), 0)
    const result = expenseData.map((row: any) => ({
      ...row,
      type: row.expense_type,
      amount: row.total,
      percentage: grandTotal > 0 ? row.total / grandTotal : 0,
    }))

    res.json({
      success: true,
      data: result
    })
  } catch (e) {
    next(e)
  }
})

router.get('/properties-by-city', authenticateTokenOrDemo, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = db.prepare(`
      SELECT 
        city,
        COUNT(*) as count,
        SUM(current_value) as total_value,
        AVG(current_value) as avg_value
      FROM properties 
      WHERE status = 'active'
      GROUP BY city
      ORDER BY count DESC
    `).all()
    
    res.json({
      success: true,
      data
    })
  } catch (e) {
    next(e)
  }
})

router.get('/recent-activity', authenticateTokenOrDemo, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 20 } = req.query
    
    const activities = db.prepare(`
      SELECT 
        a.id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.created_at,
        u.full_name as user_name
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(limit)
    
    res.json({
      success: true,
      data: activities
    })
  } catch (e) {
    next(e)
  }
})

router.get('/upcoming-reminders', authenticateTokenOrDemo, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 10 } = req.query
    
    const reminders = db.prepare(`
      SELECT *
      FROM reminders 
      WHERE status = 'pending'
      AND trigger_date >= date('now')
      ORDER BY trigger_date ASC
      LIMIT ?
    `).all(limit)
    
    res.json({
      success: true,
      data: reminders
    })
  } catch (e) {
    next(e)
  }
})

export default router
