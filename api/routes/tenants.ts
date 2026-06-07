import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 20, search, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let query = 'SELECT * FROM tenants WHERE 1=1'
    const params: any[] = []
    
    if (search) {
      query += ' AND (full_name_en LIKE ? OR full_name_zh LIKE ? OR email LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count')
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)
    
    const tenants = db.prepare(query).all(...params)
    
    tenants.forEach((tenant: any) => {
      const activeLease = db.prepare(`
        SELECT l.*, p.title as property_title
        FROM lease_agreements l
        JOIN properties p ON l.property_id = p.id
        WHERE l.tenant_id = ? AND l.status = 'active'
        ORDER BY l.start_date DESC LIMIT 1
      `).get(tenant.id)
      tenant.active_lease = activeLease
    })
    
    res.json({
      success: true,
      data: tenants,
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
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id)
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' })
    }
    
    const leases = db.prepare(`
      SELECT l.*, p.title as property_title, p.address_en
      FROM lease_agreements l
      JOIN properties p ON l.property_id = p.id
      WHERE l.tenant_id = ?
      ORDER BY l.start_date DESC
    `).all(req.params.id)
    ;(tenant as any).leases = leases
    
    const payments = db.prepare(`
      SELECT * FROM rent_payments 
      WHERE tenant_id = ?
      ORDER BY due_date DESC LIMIT 20
    `).all(req.params.id)
    ;(tenant as any).payments = payments
    
    res.json({ success: true, data: tenant })
  } catch (e) {
    next(e)
  }
})

router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body
    
    const result = db.prepare(`
      INSERT INTO tenants (
        full_name_en, full_name_zh, email, phone, identification_type, identification_no,
        nationality, employer, annual_income, rental_history, reference_name, reference_phone,
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.full_name_en, data.full_name_zh, data.email, data.phone,
      data.identification_type, data.identification_no, data.nationality,
      data.employer, data.annual_income, data.rental_history, data.reference_name,
      data.reference_phone, data.status || 'active', data.notes
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
      VALUES (?, 'create', 'tenant', ?, ?)
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
    const existing = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tenant not found' })
    }
    
    const data = req.body
    
    db.prepare(`
      UPDATE tenants SET
        full_name_en = ?, full_name_zh = ?, email = ?, phone = ?, identification_type = ?,
        identification_no = ?, nationality = ?, employer = ?, annual_income = ?,
        rental_history = ?, reference_name = ?, reference_phone = ?, status = ?,
        notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.full_name_en ?? (existing as any).full_name_en,
      data.full_name_zh ?? (existing as any).full_name_zh,
      data.email ?? (existing as any).email,
      data.phone ?? (existing as any).phone,
      data.identification_type ?? (existing as any).identification_type,
      data.identification_no ?? (existing as any).identification_no,
      data.nationality ?? (existing as any).nationality,
      data.employer ?? (existing as any).employer,
      data.annual_income ?? (existing as any).annual_income,
      data.rental_history ?? (existing as any).rental_history,
      data.reference_name ?? (existing as any).reference_name,
      data.reference_phone ?? (existing as any).reference_phone,
      data.status ?? (existing as any).status,
      data.notes ?? (existing as any).notes,
      req.params.id
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (?, 'update', 'tenant', ?, ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing), JSON.stringify(data))
    
    res.json({ success: true, message: 'Tenant updated successfully' })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tenant not found' })
    }
    
    db.prepare('DELETE FROM tenants WHERE id = ?').run(req.params.id)
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
      VALUES (?, 'delete', 'tenant', ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing))
    
    res.json({ success: true, message: 'Tenant deleted successfully' })
  } catch (e) {
    next(e)
  }
})

export default router
