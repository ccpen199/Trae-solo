import { Router, Request, Response } from 'express'
import db from '../db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const contracts = db.prepare(`
    SELECT c.*, cu.name as customer_name, cu.company as customer_company,
           w.name as warehouse_name, w.code as warehouse_code
    FROM contracts c
    LEFT JOIN customers cu ON c.customer_id = cu.id
    LEFT JOIN warehouses w ON c.warehouse_id = w.id
    ORDER BY c.created_at DESC
  `).all()
  res.json(contracts)
})

router.get('/:id', (req: Request, res: Response) => {
  const contract = db.prepare(`
    SELECT c.*, cu.name as customer_name, cu.company as customer_company, cu.contact as customer_contact, cu.phone as customer_phone,
           w.name as warehouse_name, w.code as warehouse_code, w.area as warehouse_area
    FROM contracts c
    LEFT JOIN customers cu ON c.customer_id = cu.id
    LEFT JOIN warehouses w ON c.warehouse_id = w.id
    WHERE c.id = ?
  `).get(req.params.id)
  
  if (!contract) {
    return res.status(404).json({ error: '合同不存在' })
  }
  res.json(contract)
})

function generateContractCode(): string {
  const date = new Date()
  const prefix = `HT${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const count = db.prepare('SELECT COUNT(*) as count FROM contracts WHERE code LIKE ?').get(`${prefix}%`) as { count: number }
  return `${prefix}${String(count.count + 1).padStart(4, '0')}`
}

router.post('/', (req: Request, res: Response) => {
  const { customer_id, warehouse_id, start_date, end_date, monthly_rent, property_fee, deposit, rent_free_days, increase_clause, delivery_list } = req.body
  
  const warehouse = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(warehouse_id) as any
  if (!warehouse) {
    return res.status(404).json({ error: '仓库不存在' })
  }
  
  const code = generateContractCode()
  
  try {
    const result = db.prepare(`
      INSERT INTO contracts (code, customer_id, warehouse_id, start_date, end_date, monthly_rent, property_fee, deposit, rent_free_days, increase_clause, delivery_list, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(code, customer_id, warehouse_id, start_date, end_date, monthly_rent, property_fee, deposit, rent_free_days, increase_clause, delivery_list || '[]')
    
    res.status(201).json({ id: result.lastInsertRowid, code, message: '合同创建成功' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', (req: Request, res: Response) => {
  const { customer_id, warehouse_id, start_date, end_date, monthly_rent, property_fee, deposit, rent_free_days, increase_clause, delivery_list } = req.body
  
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as any
  if (!contract) {
    return res.status(404).json({ error: '合同不存在' })
  }
  
  if (contract.status === 'approved') {
    return res.status(400).json({ error: '已审批合同无法修改' })
  }
  
  db.prepare(`
    UPDATE contracts 
    SET customer_id = ?, warehouse_id = ?, start_date = ?, end_date = ?, monthly_rent = ?, 
        property_fee = ?, deposit = ?, rent_free_days = ?, increase_clause = ?, delivery_list = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(customer_id, warehouse_id, start_date, end_date, monthly_rent, property_fee, deposit, rent_free_days, increase_clause, delivery_list || '[]', req.params.id)
  
  res.json({ message: '合同更新成功' })
})

router.post('/:id/approve', (req: Request, res: Response) => {
  const { approved_by } = req.body
  const contractId = req.params.id
  
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId) as any
  if (!contract) {
    return res.status(404).json({ error: '合同不存在' })
  }
  
  if (contract.status === 'approved') {
    return res.status(400).json({ error: '合同已审批' })
  }
  
  const warehouse = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(contract.warehouse_id) as any
  if (warehouse.status !== 'available') {
    return res.status(400).json({ error: '仓库已被占用，无法审批' })
  }
  
  db.prepare(`
    UPDATE contracts 
    SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approved_by || 'admin', contractId)
  
  db.prepare(`
    INSERT INTO warehouse_status_history (warehouse_id, old_status, new_status, reason, operator)
    VALUES (?, ?, ?, ?, ?)
  `).run(contract.warehouse_id, warehouse.status, 'rented', `合同审批通过：${contract.code}`, approved_by || 'admin')
  
  db.prepare('UPDATE warehouses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('rented', contract.warehouse_id)
  
  const startDate = new Date(contract.start_date)
  const endDate = new Date(contract.end_date)
  const billNoPrefix = `ZD${new Date().getFullYear()}`
  
  let currentDate = new Date(startDate)
  let billIndex = 1
  
  while (currentDate < endDate) {
    const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    const billNo = `${billNoPrefix}${String(billIndex).padStart(6, '0')}`
    
    const dueDate = new Date(currentDate)
    dueDate.setDate(5)
    
    db.prepare(`
      INSERT INTO bills (contract_id, bill_no, period, amount, rent_amount, property_amount, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid')
    `).run(
      contractId,
      billNo,
      period,
      contract.monthly_rent + contract.property_fee,
      contract.monthly_rent,
      contract.property_fee,
      dueDate.toISOString().split('T')[0]
    )
    
    currentDate.setMonth(currentDate.getMonth() + 1)
    billIndex++
  }
  
  res.json({ message: '合同审批成功，已生成账单' })
})

router.post('/:id/terminate', (req: Request, res: Response) => {
  const { reason, operator } = req.body
  const contractId = req.params.id
  
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId) as any
  if (!contract) {
    return res.status(404).json({ error: '合同不存在' })
  }
  
  db.prepare(`
    UPDATE contracts 
    SET status = 'terminated', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(contractId)
  
  const warehouse = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(contract.warehouse_id) as any
  db.prepare(`
    INSERT INTO warehouse_status_history (warehouse_id, old_status, new_status, reason, operator)
    VALUES (?, ?, ?, ?, ?)
  `).run(contract.warehouse_id, warehouse.status, 'available', reason || '合同终止', operator || 'admin')
  
  db.prepare('UPDATE warehouses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('available', contract.warehouse_id)
  
  res.json({ message: '合同已终止，仓库已释放' })
})

export default router
