import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

function generateReportNo() {
  const timestamp = Date.now().toString(36).toUpperCase()
  return `RPT-${timestamp}`
}

router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 20, report_type, owner_id, property_id } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let query = `
      SELECT r.*, p.title as property_title,
             o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh,
             u.full_name as generated_by_name
      FROM reports r
      LEFT JOIN properties p ON r.property_id = p.id
      LEFT JOIN owners o ON r.owner_id = o.id
      LEFT JOIN users u ON r.generated_by = u.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (report_type) {
      query += ' AND r.report_type = ?'
      params.push(report_type)
    }
    if (owner_id) {
      query += ' AND r.owner_id = ?'
      params.push(owner_id)
    }
    if (property_id) {
      query += ' AND r.property_id = ?'
      params.push(property_id)
    }
    
    const countQuery = query.replace(/SELECT r\.[^FROM]+/, 'SELECT COUNT(*) as count')
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count
    
    query += ' ORDER BY r.generated_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)
    
    const reports = db.prepare(query).all(...params)
    
    res.json({
      success: true,
      data: reports,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    })
  } catch (e) {
    next(e)
  }
})

router.post('/generate', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { report_type, language = 'zh', property_id, owner_id, period, parameters } = req.body
    
    const report_no = generateReportNo()
    
    const result = db.prepare(`
      INSERT INTO reports (
        report_no, report_type, language, property_id, owner_id, period,
        generated_by, parameters, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      report_no, report_type, language, property_id, owner_id, period,
      req.user!.id, JSON.stringify(parameters || {}), 'ready'
    )
    
    const reportId = result.lastInsertRowid
    
    let reportData: any = {}
    
    if (report_type === 'monthly_statement') {
      const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(property_id)
      const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get((property as any).owner_id)
      
      const [year, month] = (period as string).split('-')
      const startDate = `${year}-${month}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
      
      const rentalPayments = db.prepare(`
        SELECT SUM(amount) as total
        FROM rent_payments
        WHERE property_id = ? AND status = 'paid'
        AND payment_date BETWEEN ? AND ?
      `).get(property_id, startDate, endDate)
      
      const expenses = db.prepare(`
        SELECT SUM(amount) as total
        FROM expenses
        WHERE property_id = ?
        AND expense_date BETWEEN ? AND ?
      `).get(property_id, startDate, endDate)
      
      reportData = {
        property,
        owner,
        period,
        rental_income: (rentalPayments as any).total || 0,
        total_expenses: (expenses as any).total || 0,
        net_income: ((rentalPayments as any).total || 0) - ((expenses as any).total || 0),
        currency: 'AUD'
      }
    } else if (report_type === 'annual_analysis') {
        const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(property_id)
        const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get((property as any).owner_id)
        
        const year = period as string
        const startDate = `${year}-07-01`
        const endDate = `${parseInt(year) + 1}-06-30`
        
        const rentalPayments = db.prepare(`
          SELECT SUM(amount) as total
          FROM rent_payments
          WHERE property_id = ? AND status = 'paid'
          AND payment_date BETWEEN ? AND ?
        `).get(property_id, startDate, endDate)
        
        const expenses = db.prepare(`
          SELECT expense_type, SUM(amount) as total
          FROM expenses
          WHERE property_id = ?
          AND expense_date BETWEEN ? AND ?
          GROUP BY expense_type
        `).all(property_id, startDate, endDate) as any[]
        
        const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.total || 0), 0)
        
        reportData = {
          property,
          owner,
          period,
          rental_income: (rentalPayments as any).total || 0,
          expenses_breakdown: expenses,
          total_expenses: totalExpenses,
          net_income: ((rentalPayments as any).total || 0) - totalExpenses,
          depreciation: 0,
          currency: 'AUD'
        }
      } else if (report_type === 'ato_template') {
        const taxReturn = db.prepare('SELECT * FROM tax_returns WHERE id = ?').get(property_id)
        const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get((taxReturn as any).owner_id)
        
        reportData = {
          tax_return: taxReturn,
          owner,
          financial_year: (taxReturn as any).financial_year,
          template_version: '2024',
          ato_forms: ['Individual tax return instructions', 'Rental schedule']
        }
      }
      
      res.status(201).json({
        success: true,
        data: {
          id: reportId,
          report_no,
          report_type,
          language,
          content: reportData
        }
      })
    } catch (e) {
      next(e)
    }
  })

router.get('/download/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = db.prepare(`
      SELECT r.*, p.title as property_title,
             o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh
      FROM reports r
      LEFT JOIN properties p ON r.property_id = p.id
      LEFT JOIN owners o ON r.owner_id = o.id
      WHERE r.id = ?
    `).get(req.params.id)
    
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' })
    }
    
    res.json({
      success: true,
      data: report,
      download_url: `/api/reports/download/${req.params.id}/file`
    })
  } catch (e) {
    next(e)
  }
})

export default router
