import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 20, status, owner_id, financial_year } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let query = `
      SELECT t.*, p.title as property_title,
             o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh,
             u.full_name as accountant_name
      FROM tax_returns t
      LEFT JOIN properties p ON t.property_id = p.id
      JOIN owners o ON t.owner_id = o.id
      LEFT JOIN users u ON t.accountant_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (status) {
      query += ' AND t.status = ?'
      params.push(status)
    }
    if (owner_id) {
      query += ' AND t.owner_id = ?'
      params.push(owner_id)
    }
    if (financial_year) {
      query += ' AND t.financial_year = ?'
      params.push(financial_year)
    }
    
    const countQuery = query.replace(/SELECT t\.[^FROM]+/, 'SELECT COUNT(*) as count')
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count
    
    query += ' ORDER BY t.financial_year DESC, t.due_date DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)
    
    const taxReturns = db.prepare(query).all(...params)
    
    res.json({
      success: true,
      data: taxReturns,
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

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const taxReturn = db.prepare(`
      SELECT t.*, p.title as property_title, p.address_en,
             o.*, u.full_name as accountant_name
      FROM tax_returns t
      LEFT JOIN properties p ON t.property_id = p.id
      JOIN owners o ON t.owner_id = o.id
      LEFT JOIN users u ON t.accountant_id = u.id
      WHERE t.id = ?
    `).get(req.params.id)
    
    if (!taxReturn) {
      return res.status(404).json({ success: false, error: 'Tax return not found' })
    }
    
    const depreciation = db.prepare(`
      SELECT * FROM depreciation_reports 
      WHERE property_id = ? AND report_year = ?
    `).get((taxReturn as any).property_id, parseInt((taxReturn as any).financial_year))
    ;(taxReturn as any).depreciation_report = depreciation
    
    res.json({ success: true, data: taxReturn })
  } catch (e) {
    next(e)
  }
})

router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body
    
    const result = db.prepare(`
      INSERT INTO tax_returns (
        owner_id, property_id, financial_year, lodgement_date, due_date, status,
        total_income, total_expenses, taxable_income, tax_payable, tax_withheld,
        refund_amount, payment_amount, payment_date, accountant_id, ato_document_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.owner_id, data.property_id, data.financial_year, data.lodgement_date,
      data.due_date, data.status || 'pending', data.total_income || 0,
      data.total_expenses || 0, data.taxable_income || 0, data.tax_payable || 0,
      data.tax_withheld || 0, data.refund_amount || 0, data.payment_amount || 0,
      data.payment_date, data.accountant_id, data.ato_document_url, data.notes
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
      VALUES (?, 'create', 'tax_return', ?, ?)
    `).run(req.user!.id, result.lastInsertRowid, JSON.stringify(data))
    
    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, ...data }
    })
  } catch (e) {
    next(e)
  }
})

router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM tax_returns WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tax return not found' })
    }
    
    const data = req.body
    
    db.prepare(`
      UPDATE tax_returns SET
        owner_id = ?, property_id = ?, financial_year = ?, lodgement_date = ?, due_date = ?,
        status = ?, total_income = ?, total_expenses = ?, taxable_income = ?, tax_payable = ?,
        tax_withheld = ?, refund_amount = ?, payment_amount = ?, payment_date = ?,
        accountant_id = ?, ato_document_url = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.owner_id ?? (existing as any).owner_id,
      data.property_id ?? (existing as any).property_id,
      data.financial_year ?? (existing as any).financial_year,
      data.lodgement_date ?? (existing as any).lodgement_date,
      data.due_date ?? (existing as any).due_date,
      data.status ?? (existing as any).status,
      data.total_income ?? (existing as any).total_income,
      data.total_expenses ?? (existing as any).total_expenses,
      data.taxable_income ?? (existing as any).taxable_income,
      data.tax_payable ?? (existing as any).tax_payable,
      data.tax_withheld ?? (existing as any).tax_withheld,
      data.refund_amount ?? (existing as any).refund_amount,
      data.payment_amount ?? (existing as any).payment_amount,
      data.payment_date ?? (existing as any).payment_date,
      data.accountant_id ?? (existing as any).accountant_id,
      data.ato_document_url ?? (existing as any).ato_document_url,
      data.notes ?? (existing as any).notes,
      req.params.id
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (?, 'update', 'tax_return', ?, ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing), JSON.stringify(data))
    
    res.json({ success: true, message: 'Tax return updated successfully' })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM tax_returns WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tax return not found' })
    }
    
    db.prepare('DELETE FROM tax_returns WHERE id = ?').run(req.params.id)
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
      VALUES (?, 'delete', 'tax_return', ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing))
    
    res.json({ success: true, message: 'Tax return deleted successfully' })
  } catch (e) {
    next(e)
  }
})

export default router
