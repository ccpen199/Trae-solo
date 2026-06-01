import { Router, Request, Response } from 'express'
import db from '../db'

const router = Router()

router.get('/overview', (req: Request, res: Response) => {
  const warehouseStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented,
      SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
      SUM(area) as total_area
    FROM warehouses
  `).get()
  
  const contractStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'terminated' THEN 1 ELSE 0 END) as terminated
    FROM contracts
  `).get()
  
  const billStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid,
      SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
      SUM(amount) as total_amount,
      SUM(paid_amount) as paid_amount
    FROM bills
  `).get()
  
  const overdueBills = db.prepare(`
    SELECT COUNT(*) as count 
    FROM bills 
    WHERE status IN ('unpaid', 'partial') 
    AND due_date < DATE('now')
  `).get()
  
  res.json({
    warehouses: warehouseStats,
    contracts: contractStats,
    bills: billStats,
    overdue_bills: overdueBills
  })
})

router.get('/warehouse-utilization', (req: Request, res: Response) => {
  const data = db.prepare(`
    SELECT 
      w.id,
      w.name,
      w.code,
      w.area,
      w.status,
      c.code as contract_code,
      cu.name as customer_name,
      c.start_date,
      c.end_date
    FROM warehouses w
    LEFT JOIN contracts c ON w.id = c.warehouse_id AND c.status = 'approved'
    LEFT JOIN customers cu ON c.customer_id = cu.id
    ORDER BY w.code
  `).all()
  
  res.json(data)
})

router.get('/revenue', (req: Request, res: Response) => {
  const { year } = req.query
  const targetYear = year || new Date().getFullYear()
  
  const data = db.prepare(`
    SELECT 
      strftime('%Y-%m', b.due_date) as period,
      SUM(b.rent_amount) as rent_revenue,
      SUM(b.property_amount) as property_revenue,
      SUM(b.amount) as total_revenue,
      SUM(b.paid_amount) as received_amount
    FROM bills b
    WHERE strftime('%Y', b.due_date) = ?
    GROUP BY strftime('%Y-%m', b.due_date)
    ORDER BY period
  `).all(targetYear)
  
  res.json(data)
})

router.get('/check-duplicate-rental', (req: Request, res: Response) => {
  const duplicates = db.prepare(`
    SELECT 
      w.id as warehouse_id,
      w.name as warehouse_name,
      w.code as warehouse_code,
      w.status,
      COUNT(c.id) as active_contracts
    FROM warehouses w
    LEFT JOIN contracts c ON w.id = c.warehouse_id AND c.status = 'approved'
    WHERE w.status = 'rented'
    GROUP BY w.id
    HAVING active_contracts > 1
  `).all()
  
  res.json({
    has_duplicates: duplicates.length > 0,
    duplicates
  })
})

router.get('/overdue-bills', (req: Request, res: Response) => {
  const bills = db.prepare(`
    SELECT 
      b.*,
      c.code as contract_code,
      cu.name as customer_name,
      w.name as warehouse_name,
      julianday('now') - julianday(b.due_date) as overdue_days
    FROM bills b
    LEFT JOIN contracts c ON b.contract_id = c.id
    LEFT JOIN customers cu ON c.customer_id = cu.id
    LEFT JOIN warehouses w ON c.warehouse_id = w.id
    WHERE b.status IN ('unpaid', 'partial')
    AND b.due_date < DATE('now')
    ORDER BY overdue_days DESC
  `).all()
  
  res.json(bills)
})

router.get('/customer-analysis', (req: Request, res: Response) => {
  const data = db.prepare(`
    SELECT 
      cu.id,
      cu.name,
      cu.company,
      cu.industry,
      COUNT(c.id) as contract_count,
      SUM(b.amount) as total_spend,
      SUM(b.paid_amount) as total_paid
    FROM customers cu
    LEFT JOIN contracts c ON cu.id = c.customer_id
    LEFT JOIN bills b ON c.id = b.contract_id
    GROUP BY cu.id
    ORDER BY total_spend DESC
  `).all()
  
  res.json(data)
})

export default router
