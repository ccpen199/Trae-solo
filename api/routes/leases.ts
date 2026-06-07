import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

function generateAgreementNo() {
  const year = new Date().getFullYear()
  const count = db.prepare("SELECT COUNT(*) as count FROM lease_agreements WHERE agreement_no LIKE ?").get(`LA-${year}-%`) as { count: number }
  return `LA-${year}-${String(count.count + 1).padStart(4, '0')}`
}

router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 20, status, property_id, tenant_id, owner_id } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let query = `
      SELECT l.*, p.title as property_title, p.address_en,
             t.full_name_en as tenant_name_en, t.full_name_zh as tenant_name_zh,
             o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh
      FROM lease_agreements l
      JOIN properties p ON l.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      JOIN owners o ON l.owner_id = o.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (status) {
      query += ' AND l.status = ?'
      params.push(status)
    }
    if (property_id) {
      query += ' AND l.property_id = ?'
      params.push(property_id)
    }
    if (tenant_id) {
      query += ' AND l.tenant_id = ?'
      params.push(tenant_id)
    }
    if (owner_id) {
      query += ' AND l.owner_id = ?'
      params.push(owner_id)
    }
    
    const countQuery = query.replace(/SELECT l\.[^FROM]+/, 'SELECT COUNT(*) as count')
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count
    
    query += ' ORDER BY l.start_date DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)
    
    const leases = db.prepare(query).all(...params)
    
    res.json({
      success: true,
      data: leases,
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
    const lease = db.prepare(`
      SELECT l.*, p.title as property_title, p.address_en, p.address_zh,
             t.*, o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh
      FROM lease_agreements l
      JOIN properties p ON l.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      JOIN owners o ON l.owner_id = o.id
      WHERE l.id = ?
    `).get(req.params.id)
    
    if (!lease) {
      return res.status(404).json({ success: false, error: 'Lease agreement not found' })
    }
    
    const payments = db.prepare(`
      SELECT * FROM rent_payments 
      WHERE lease_id = ?
      ORDER BY due_date DESC
    `).all(req.params.id)
    ;(lease as any).payments = payments
    
    res.json({ success: true, data: lease })
  } catch (e) {
    next(e)
  }
})

router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body
    const agreement_no = data.agreement_no || generateAgreementNo()
    
    const result = db.prepare(`
      INSERT INTO lease_agreements (
        property_id, tenant_id, owner_id, agreement_no, agreement_type,
        start_date, end_date, is_fixed_term, rent_amount, rent_frequency,
        bond_amount, bond_lodged, bond_lodgement_date, rent_payment_day,
        lease_document_url, special_conditions, status, auto_renewal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.property_id, data.tenant_id, data.owner_id, agreement_no,
      data.agreement_type || 'residential', data.start_date, data.end_date,
      data.is_fixed_term ?? 1, data.rent_amount, data.rent_frequency || 'weekly',
      data.bond_amount, data.bond_lodged || 0, data.bond_lodgement_date,
      data.rent_payment_day, data.lease_document_url, data.special_conditions,
      data.status || 'active', data.auto_renewal || 0
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
      VALUES (?, 'create', 'lease_agreement', ?, ?)
    `).run(req.user!.id, result.lastInsertRowid, JSON.stringify({ ...data, agreement_no }))
    
    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, agreement_no, ...data }
    })
  } catch (e) {
    next(e)
  }
})

router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM lease_agreements WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Lease agreement not found' })
    }
    
    const data = req.body
    
    db.prepare(`
      UPDATE lease_agreements SET
        property_id = ?, tenant_id = ?, owner_id = ?, agreement_type = ?,
        start_date = ?, end_date = ?, is_fixed_term = ?, rent_amount = ?,
        rent_frequency = ?, bond_amount = ?, bond_lodged = ?, bond_lodgement_date = ?,
        rent_payment_day = ?, lease_document_url = ?, special_conditions = ?,
        status = ?, auto_renewal = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.property_id ?? (existing as any).property_id,
      data.tenant_id ?? (existing as any).tenant_id,
      data.owner_id ?? (existing as any).owner_id,
      data.agreement_type ?? (existing as any).agreement_type,
      data.start_date ?? (existing as any).start_date,
      data.end_date ?? (existing as any).end_date,
      data.is_fixed_term ?? (existing as any).is_fixed_term,
      data.rent_amount ?? (existing as any).rent_amount,
      data.rent_frequency ?? (existing as any).rent_frequency,
      data.bond_amount ?? (existing as any).bond_amount,
      data.bond_lodged ?? (existing as any).bond_lodged,
      data.bond_lodgement_date ?? (existing as any).bond_lodgement_date,
      data.rent_payment_day ?? (existing as any).rent_payment_day,
      data.lease_document_url ?? (existing as any).lease_document_url,
      data.special_conditions ?? (existing as any).special_conditions,
      data.status ?? (existing as any).status,
      data.auto_renewal ?? (existing as any).auto_renewal,
      req.params.id
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (?, 'update', 'lease_agreement', ?, ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing), JSON.stringify(data))
    
    res.json({ success: true, message: 'Lease agreement updated successfully' })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM lease_agreements WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Lease agreement not found' })
    }
    
    db.prepare('DELETE FROM lease_agreements WHERE id = ?').run(req.params.id)
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
      VALUES (?, 'delete', 'lease_agreement', ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing))
    
    res.json({ success: true, message: 'Lease agreement deleted successfully' })
  } catch (e) {
    next(e)
  }
})

export default router
