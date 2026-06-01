const express = require('express')
const Joi = require('joi')
const { db } = require('../database')
const router = express.Router()

const customerSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  contact: Joi.string().allow(''),
  phone: Joi.string().allow(''),
  address: Joi.string().allow(''),
  billing_method: Joi.string().valid('daily', 'weekly', 'monthly').default('daily')
})

router.get('/', (req, res) => {
  const customers = db.prepare(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM products WHERE customer_id = c.id) as product_count,
           (SELECT COUNT(*) FROM inventory WHERE customer_id = c.id) as inventory_count
    FROM customers c
    ORDER BY c.created_at DESC
  `).all()
  res.json(customers)
})

router.get('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id)
  if (!customer) return res.status(404).json({ error: '客户不存在' })
  res.json(customer)
})

router.post('/', (req, res) => {
  const { error, value } = customerSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const existing = db.prepare('SELECT id FROM customers WHERE code = ?').get(value.code)
  if (existing) return res.status(400).json({ error: '客户编码已存在' })

  const result = db.prepare(`
    INSERT INTO customers (code, name, contact, phone, address, billing_method)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(value.code, value.name, value.contact, value.phone, value.address, value.billing_method)

  res.json({ id: result.lastInsertRowid, ...value })
})

router.put('/:id', (req, res) => {
  const { error, value } = customerSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id)
  if (!customer) return res.status(404).json({ error: '客户不存在' })

  const existing = db.prepare('SELECT id FROM customers WHERE code = ? AND id != ?').get(value.code, req.params.id)
  if (existing) return res.status(400).json({ error: '客户编码已存在' })

  db.prepare(`
    UPDATE customers 
    SET code = ?, name = ?, contact = ?, phone = ?, address = ?, billing_method = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(value.code, value.name, value.contact, value.phone, value.address, value.billing_method, req.params.id)

  res.json({ id: req.params.id, ...value })
})

router.delete('/:id', (req, res) => {
  const products = db.prepare('SELECT COUNT(*) as count FROM products WHERE customer_id = ?').get(req.params.id)
  if (products.count > 0) return res.status(400).json({ error: '该客户下还有货品，无法删除' })

  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
