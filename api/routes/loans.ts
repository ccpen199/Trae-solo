import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 20, status, property_id, owner_id } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let fromWhere = `
      FROM loan_contracts l
      JOIN properties p ON l.property_id = p.id
      JOIN owners o ON l.owner_id = o.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (status) {
      fromWhere += ' AND l.status = ?'
      params.push(status)
    }
    if (property_id) {
      fromWhere += ' AND l.property_id = ?'
      params.push(property_id)
    }
    if (owner_id) {
      fromWhere += ' AND l.owner_id = ?'
      params.push(owner_id)
    }
    
    let query = `
      SELECT l.*, 'LC-' || printf('%04d', l.id) as contract_no,
             l.maturity_date as end_date, l.monthly_repayment as monthly_payment,
             l.next_repayment_date as next_payment_date, l.remaining_balance as remaining_amount,
             p.title as property_title, p.address_en,
             o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh
      ${fromWhere}
    `
    const countQuery = `SELECT COUNT(*) as count ${fromWhere}`
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count
    
    query += ' ORDER BY l.start_date DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)
    
    const loans = db.prepare(query).all(...params)
    
    res.json({
      success: true,
      data: loans,
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
    const loan = db.prepare(`
      SELECT l.*, 'LC-' || printf('%04d', l.id) as contract_no,
             l.maturity_date as end_date, l.monthly_repayment as monthly_payment,
             l.next_repayment_date as next_payment_date, l.remaining_balance as remaining_amount,
             p.title as property_title, p.address_en, p.address_zh,
             o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh
      FROM loan_contracts l
      JOIN properties p ON l.property_id = p.id
      JOIN owners o ON l.owner_id = o.id
      WHERE l.id = ?
    `).get(req.params.id)
    
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan contract not found' })
    }
    
    res.json({ success: true, data: loan })
  } catch (e) {
    next(e)
  }
})

router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body
    
    const result = db.prepare(`
      INSERT INTO loan_contracts (
        property_id, owner_id, lender, loan_amount, interest_rate, rate_type,
        loan_term, start_date, maturity_date, monthly_repayment, repayment_day,
        offset_account, loan_type, loan_purpose, valuation_amount, lvr,
        insurance_premium, remaining_balance, next_repayment_date, status,
        contract_document_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.property_id, data.owner_id, data.lender, data.loan_amount, data.interest_rate,
      data.rate_type || 'variable', data.loan_term, data.start_date, data.maturity_date,
      data.monthly_repayment, data.repayment_day, data.offset_account,
      data.loan_type || 'principal_and_interest', data.loan_purpose || 'investment',
      data.valuation_amount, data.lvr, data.insurance_premium || 0,
      data.remaining_balance || data.loan_amount, data.next_repayment_date,
      data.status || 'active', data.contract_document_url, data.notes
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
      VALUES (?, 'create', 'loan_contract', ?, ?)
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
    const existing = db.prepare('SELECT * FROM loan_contracts WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Loan contract not found' })
    }
    
    const data = req.body
    
    db.prepare(`
      UPDATE loan_contracts SET
        property_id = ?, owner_id = ?, lender = ?, loan_amount = ?, interest_rate = ?,
        rate_type = ?, loan_term = ?, start_date = ?, maturity_date = ?, monthly_repayment = ?,
        repayment_day = ?, offset_account = ?, loan_type = ?, loan_purpose = ?, valuation_amount = ?,
        lvr = ?, insurance_premium = ?, remaining_balance = ?, next_repayment_date = ?,
        status = ?, contract_document_url = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.property_id ?? (existing as any).property_id,
      data.owner_id ?? (existing as any).owner_id,
      data.lender ?? (existing as any).lender,
      data.loan_amount ?? (existing as any).loan_amount,
      data.interest_rate ?? (existing as any).interest_rate,
      data.rate_type ?? (existing as any).rate_type,
      data.loan_term ?? (existing as any).loan_term,
      data.start_date ?? (existing as any).start_date,
      data.maturity_date ?? (existing as any).maturity_date,
      data.monthly_repayment ?? (existing as any).monthly_repayment,
      data.repayment_day ?? (existing as any).repayment_day,
      data.offset_account ?? (existing as any).offset_account,
      data.loan_type ?? (existing as any).loan_type,
      data.loan_purpose ?? (existing as any).loan_purpose,
      data.valuation_amount ?? (existing as any).valuation_amount,
      data.lvr ?? (existing as any).lvr,
      data.insurance_premium ?? (existing as any).insurance_premium,
      data.remaining_balance ?? (existing as any).remaining_balance,
      data.next_repayment_date ?? (existing as any).next_repayment_date,
      data.status ?? (existing as any).status,
      data.contract_document_url ?? (existing as any).contract_document_url,
      data.notes ?? (existing as any).notes,
      req.params.id
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (?, 'update', 'loan_contract', ?, ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing), JSON.stringify(data))
    
    res.json({ success: true, message: 'Loan contract updated successfully' })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM loan_contracts WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Loan contract not found' })
    }
    
    db.prepare('DELETE FROM loan_contracts WHERE id = ?').run(req.params.id)
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
      VALUES (?, 'delete', 'loan_contract', ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing))
    
    res.json({ success: true, message: 'Loan contract deleted successfully' })
  } catch (e) {
    next(e)
  }
})

export default router
