import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { city, status, owner_id, page = 1, pageSize = 20 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let query = 'SELECT * FROM properties WHERE 1=1'
    const params: any[] = []
    
    if (city) {
      query += ' AND city LIKE ?'
      params.push(`%${city}%`)
    }
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    if (owner_id) {
      query += ' AND owner_id = ?'
      params.push(owner_id)
    }
    
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count')
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)
    
    const properties = db.prepare(query).all(...params)
    
    properties.forEach((prop: any) => {
      const owner = db.prepare('SELECT id, full_name_en, full_name_zh, email FROM owners WHERE id = ?').get(prop.owner_id)
      prop.owner = owner
      
      const activeLease = db.prepare(`
        SELECT * FROM lease_agreements 
        WHERE property_id = ? AND status = 'active'
        ORDER BY start_date DESC LIMIT 1
      `).get(prop.id)
      prop.active_lease = activeLease
      
      const loan = db.prepare(`
        SELECT * FROM loan_contracts 
        WHERE property_id = ? AND status = 'active'
        ORDER BY start_date DESC LIMIT 1
      `).get(prop.id)
      prop.active_loan = loan
    })
    
    res.json({
      success: true,
      data: properties,
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
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id)
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' })
    }
    
    const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get((property as any).owner_id)
    ;(property as any).owner = owner
    
    const leases = db.prepare(`
      SELECT l.*, t.full_name_en as tenant_name_en, t.full_name_zh as tenant_name_zh
      FROM lease_agreements l
      LEFT JOIN tenants t ON l.tenant_id = t.id
      WHERE l.property_id = ?
      ORDER BY l.start_date DESC
    `).all(req.params.id)
    ;(property as any).leases = leases
    
    const loans = db.prepare('SELECT * FROM loan_contracts WHERE property_id = ? ORDER BY start_date DESC').all(req.params.id)
    ;(property as any).loans = loans
    
    const payments = db.prepare(`
      SELECT * FROM rent_payments 
      WHERE property_id = ?
      ORDER BY due_date DESC LIMIT 12
    `).all(req.params.id)
    ;(property as any).recent_payments = payments
    
    const expenses = db.prepare(`
      SELECT * FROM expenses 
      WHERE property_id = ?
      ORDER BY expense_date DESC LIMIT 12
    `).all(req.params.id)
    ;(property as any).recent_expenses = expenses
    
    const taxReturns = db.prepare('SELECT * FROM tax_returns WHERE property_id = ? ORDER BY financial_year DESC').all(req.params.id)
    ;(property as any).tax_returns = taxReturns
    
    const depreciation = db.prepare('SELECT * FROM depreciation_reports WHERE property_id = ? ORDER BY report_year DESC').all(req.params.id)
    ;(property as any).depreciation_reports = depreciation
    
    const documents = db.prepare('SELECT * FROM property_documents WHERE property_id = ? ORDER BY created_at DESC').all(req.params.id)
    ;(property as any).documents = documents
    
    res.json({ success: true, data: property })
  } catch (e) {
    next(e)
  }
})

router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body
    
    const result = db.prepare(`
      INSERT INTO properties (
        owner_id, property_type, title, address_en, address_zh, city, state, postcode,
        bedrooms, bathrooms, parking_spaces, land_area, building_area, year_built,
        purchase_price, purchase_date, current_value, valuation_date,
        council_rate, water_rate, strata_fee, insurance_fee, land_tax, management_fee,
        status, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.owner_id, data.property_type, data.title, data.address_en, data.address_zh,
      data.city, data.state, data.postcode, data.bedrooms || 0, data.bathrooms || 0,
      data.parking_spaces || 0, data.land_area, data.building_area, data.year_built,
      data.purchase_price, data.purchase_date, data.current_value, data.valuation_date,
      data.council_rate || 0, data.water_rate || 0, data.strata_fee || 0,
      data.insurance_fee || 0, data.land_tax || 0, data.management_fee || 0,
      data.status || 'active', data.description
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
      VALUES (?, 'create', 'property', ?, ?)
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
    const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Property not found' })
    }
    
    const data = req.body
    
    db.prepare(`
      UPDATE properties SET
        owner_id = ?, property_type = ?, title = ?, address_en = ?, address_zh = ?,
        city = ?, state = ?, postcode = ?, bedrooms = ?, bathrooms = ?, parking_spaces = ?,
        land_area = ?, building_area = ?, year_built = ?, purchase_price = ?, purchase_date = ?,
        current_value = ?, valuation_date = ?, council_rate = ?, water_rate = ?, strata_fee = ?,
        insurance_fee = ?, land_tax = ?, management_fee = ?, status = ?, description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.owner_id ?? (existing as any).owner_id,
      data.property_type ?? (existing as any).property_type,
      data.title ?? (existing as any).title,
      data.address_en ?? (existing as any).address_en,
      data.address_zh ?? (existing as any).address_zh,
      data.city ?? (existing as any).city,
      data.state ?? (existing as any).state,
      data.postcode ?? (existing as any).postcode,
      data.bedrooms ?? (existing as any).bedrooms,
      data.bathrooms ?? (existing as any).bathrooms,
      data.parking_spaces ?? (existing as any).parking_spaces,
      data.land_area ?? (existing as any).land_area,
      data.building_area ?? (existing as any).building_area,
      data.year_built ?? (existing as any).year_built,
      data.purchase_price ?? (existing as any).purchase_price,
      data.purchase_date ?? (existing as any).purchase_date,
      data.current_value ?? (existing as any).current_value,
      data.valuation_date ?? (existing as any).valuation_date,
      data.council_rate ?? (existing as any).council_rate,
      data.water_rate ?? (existing as any).water_rate,
      data.strata_fee ?? (existing as any).strata_fee,
      data.insurance_fee ?? (existing as any).insurance_fee,
      data.land_tax ?? (existing as any).land_tax,
      data.management_fee ?? (existing as any).management_fee,
      data.status ?? (existing as any).status,
      data.description ?? (existing as any).description,
      req.params.id
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (?, 'update', 'property', ?, ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing), JSON.stringify(data))
    
    res.json({ success: true, message: 'Property updated successfully' })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Property not found' })
    }
    
    db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id)
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
      VALUES (?, 'delete', 'property', ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing))
    
    res.json({ success: true, message: 'Property deleted successfully' })
  } catch (e) {
    next(e)
  }
})

export default router
