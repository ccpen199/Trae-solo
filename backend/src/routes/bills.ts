import { Router, Request, Response } from 'express'
import db from '../db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { status, contract_id } = req.query
  let sql = `
    SELECT b.*, c.code as contract_code, cu.name as customer_name, w.name as warehouse_name
    FROM bills b
    LEFT JOIN contracts c ON b.contract_id = c.id
    LEFT JOIN customers cu ON c.customer_id = cu.id
    LEFT JOIN warehouses w ON c.warehouse_id = w.id
  `
  const params: any[] = []
  const conditions: string[] = []
  
  if (status) {
    conditions.push('b.status = ?')
    params.push(status)
  }
  if (contract_id) {
    conditions.push('b.contract_id = ?')
    params.push(contract_id)
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }
  sql += ' ORDER BY b.due_date DESC'
  
  const bills = db.prepare(sql).all(...params)
  res.json(bills)
})

router.get('/:id', (req: Request, res: Response) => {
  const bill = db.prepare(`
    SELECT b.*, c.code as contract_code, c.start_date, c.end_date,
           cu.name as customer_name, cu.company as customer_company,
           w.name as warehouse_name
    FROM bills b
    LEFT JOIN contracts c ON b.contract_id = c.id
    LEFT JOIN customers cu ON c.customer_id = cu.id
    LEFT JOIN warehouses w ON c.warehouse_id = w.id
    WHERE b.id = ?
  `).get(req.params.id)
  
  if (!bill) {
    return res.status(404).json({ error: '账单不存在' })
  }
  res.json(bill)
})

router.get('/:id/payments', (req: Request, res: Response) => {
  const payments = db.prepare(`
    SELECT * FROM bill_payments WHERE bill_id = ? ORDER BY payment_date DESC
  `).all(req.params.id)
  res.json(payments)
})

router.post('/:id/pay', (req: Request, res: Response) => {
  const { amount, payment_method, remark } = req.body
  const billId = req.params.id
  
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId) as any
  if (!bill) {
    return res.status(404).json({ error: '账单不存在' })
  }
  
  const newPaidAmount = bill.paid_amount + amount
  const newStatus = newPaidAmount >= bill.amount ? 'paid' : 'partial'
  
  db.prepare(`
    INSERT INTO bill_payments (bill_id, amount, payment_method, payment_date, remark)
    VALUES (?, ?, ?, CURRENT_DATE, ?)
  `).run(billId, amount, payment_method || 'bank', remark || '')
  
  db.prepare(`
    UPDATE bills 
    SET paid_amount = ?, status = ?, paid_date = CASE WHEN ? = 'paid' THEN CURRENT_DATE ELSE paid_date END, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newPaidAmount, newStatus, newStatus, billId)
  
  res.json({ message: '付款记录已添加', paid_amount: newPaidAmount, status: newStatus })
})

router.post('/:id/discount', (req: Request, res: Response) => {
  const { discount, reason } = req.body
  const billId = req.params.id
  
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId) as any
  if (!bill) {
    return res.status(404).json({ error: '账单不存在' })
  }
  
  const newAmount = Math.max(0, bill.amount - discount)
  
  db.prepare(`
    UPDATE bills 
    SET discount = discount + ?, amount = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(discount, newAmount, billId)
  
  res.json({ message: '减免已应用', new_amount: newAmount })
})

router.post('/:id/invoice', (req: Request, res: Response) => {
  const { invoice_no } = req.body
  const billId = req.params.id
  
  db.prepare(`
    UPDATE bills 
    SET invoice_no = ?, invoice_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(invoice_no, billId)
  
  res.json({ message: '开票信息已更新' })
})

export default router
