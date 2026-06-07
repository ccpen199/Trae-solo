import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 20, search } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let query = 'SELECT * FROM owners WHERE 1=1'
    const params: any[] = []
    
    if (search) {
      query += ' AND (full_name_en LIKE ? OR full_name_zh LIKE ? OR email LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count')
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)
    
    const owners = db.prepare(query).all(...params)
    
    owners.forEach((owner: any) => {
      const properties = db.prepare('SELECT COUNT(*) as count FROM properties WHERE owner_id = ?').get(owner.id) as { count: number }
      owner.property_count = properties.count
      
      const totalValue = db.prepare('SELECT SUM(current_value) as total FROM properties WHERE owner_id = ?').get(owner.id) as { total: number }
      owner.total_property_value = totalValue.total || 0
    })
    
    res.json({
      success: true,
      data: owners,
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
    const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get(req.params.id)
    if (!owner) {
      return res.status(404).json({ success: false, error: 'Owner not found' })
    }
    
    const properties = db.prepare('SELECT * FROM properties WHERE owner_id = ? ORDER BY created_at DESC').all(req.params.id)
    ;(owner as any).properties = properties
    
    const leases = db.prepare(`
      SELECT l.*, p.title as property_title
      FROM lease_agreements l
      JOIN properties p ON l.property_id = p.id
      WHERE l.owner_id = ?
      ORDER BY l.start_date DESC
    `).all(req.params.id)
    ;(owner as any).leases = leases
    
    const loans = db.prepare(`
      SELECT l.*, p.title as property_title
      FROM loan_contracts l
      JOIN properties p ON l.property_id = p.id
      WHERE l.owner_id = ?
      ORDER BY l.start_date DESC
    `).all(req.params.id)
    ;(owner as any).loans = loans
    
    const taxReturns = db.prepare('SELECT * FROM tax_returns WHERE owner_id = ? ORDER BY financial_year DESC').all(req.params.id)
    ;(owner as any).tax_returns = taxReturns
    
    res.json({ success: true, data: owner })
  } catch (e) {
    next(e)
  }
})

router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body
    
    const result = db.prepare(`
      INSERT INTO owners (
        user_id, full_name_en, full_name_zh, email, phone, nationality, dual_citizenship,
        passport_no, visa_type, tfn, arbn, address_en, address_zh, bank_account, bank_name,
        tax_residence, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.user_id, data.full_name_en, data.full_name_zh, data.email, data.phone,
      data.nationality, data.dual_citizenship || 0, data.passport_no, data.visa_type,
      data.tfn, data.arbn, data.address_en, data.address_zh, data.bank_account,
      data.bank_name, data.tax_residence, data.notes
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
      VALUES (?, 'create', 'owner', ?, ?)
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
    const existing = db.prepare('SELECT * FROM owners WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Owner not found' })
    }
    
    const data = req.body
    
    db.prepare(`
      UPDATE owners SET
        user_id = ?, full_name_en = ?, full_name_zh = ?, email = ?, phone = ?,
        nationality = ?, dual_citizenship = ?, passport_no = ?, visa_type = ?, tfn = ?,
        arbn = ?, address_en = ?, address_zh = ?, bank_account = ?, bank_name = ?,
        tax_residence = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.user_id ?? (existing as any).user_id,
      data.full_name_en ?? (existing as any).full_name_en,
      data.full_name_zh ?? (existing as any).full_name_zh,
      data.email ?? (existing as any).email,
      data.phone ?? (existing as any).phone,
      data.nationality ?? (existing as any).nationality,
      data.dual_citizenship ?? (existing as any).dual_citizenship,
      data.passport_no ?? (existing as any).passport_no,
      data.visa_type ?? (existing as any).visa_type,
      data.tfn ?? (existing as any).tfn,
      data.arbn ?? (existing as any).arbn,
      data.address_en ?? (existing as any).address_en,
      data.address_zh ?? (existing as any).address_zh,
      data.bank_account ?? (existing as any).bank_account,
      data.bank_name ?? (existing as any).bank_name,
      data.tax_residence ?? (existing as any).tax_residence,
      data.notes ?? (existing as any).notes,
      req.params.id
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (?, 'update', 'owner', ?, ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing), JSON.stringify(data))
    
    res.json({ success: true, message: 'Owner updated successfully' })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM owners WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Owner not found' })
    }
    
    db.prepare('DELETE FROM owners WHERE id = ?').run(req.params.id)
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
      VALUES (?, 'delete', 'owner', ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing))
    
    res.json({ success: true, message: 'Owner deleted successfully' })
  } catch (e) {
    next(e)
  }
})

export default router
