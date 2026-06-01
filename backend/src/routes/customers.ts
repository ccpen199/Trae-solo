import { Router, Request, Response } from 'express'
import db from '../db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all()
  res.json(customers)
})

router.get('/:id', (req: Request, res: Response) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id)
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' })
  }
  res.json(customer)
})

router.post('/', (req: Request, res: Response) => {
  const { name, contact, phone, email, industry, company } = req.body
  
  const result = db.prepare(`
    INSERT INTO customers (name, contact, phone, email, industry, company)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, contact, phone, email, industry, company)
  
  res.status(201).json({ id: result.lastInsertRowid, message: '客户创建成功' })
})

router.put('/:id', (req: Request, res: Response) => {
  const { name, contact, phone, email, industry, company } = req.body
  
  const result = db.prepare(`
    UPDATE customers 
    SET name = ?, contact = ?, phone = ?, email = ?, industry = ?, company = ?
    WHERE id = ?
  `).run(name, contact, phone, email, industry, company, req.params.id)
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '客户不存在' })
  }
  
  res.json({ message: '客户更新成功' })
})

router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: '客户不存在' })
  }
  res.json({ message: '客户删除成功' })
})

export default router
