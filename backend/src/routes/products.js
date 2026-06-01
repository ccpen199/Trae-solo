const express = require('express')
const Joi = require('joi')
const { db } = require('../database')
const router = express.Router()

const productSchema = Joi.object({
  id: Joi.number().optional(),
  code: Joi.string().required(),
  name: Joi.string().required(),
  customer_id: Joi.number().required(),
  temperature_zone_id: Joi.number().required(),
  shelf_life_days: Joi.number().allow(null),
  batch_required: Joi.number().valid(0, 1).default(1),
  package_type: Joi.string().allow(''),
  inspection_required: Joi.number().valid(0, 1).default(0),
  storage_fee: Joi.number().default(0),
  handling_fee: Joi.number().default(0),
  unit: Joi.string().allow('')
})

router.get('/', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, 
           c.name as customer_name,
           tz.name as temperature_zone_name,
           tz.min_temp,
           tz.max_temp
    FROM products p
    JOIN customers c ON p.customer_id = c.id
    JOIN temperature_zones tz ON p.temperature_zone_id = tz.id
    ORDER BY p.created_at DESC
  `).all()
  res.json(products)
})

router.get('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, 
           c.name as customer_name,
           tz.name as temperature_zone_name
    FROM products p
    JOIN customers c ON p.customer_id = c.id
    JOIN temperature_zones tz ON p.temperature_zone_id = tz.id
    WHERE p.id = ?
  `).get(req.params.id)
  if (!product) return res.status(404).json({ error: '货品不存在' })
  res.json(product)
})

router.post('/', (req, res) => {
  const { error, value } = productSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(value.customer_id)
  if (!customer) return res.status(400).json({ error: '客户不存在' })

  const zone = db.prepare('SELECT id FROM temperature_zones WHERE id = ?').get(value.temperature_zone_id)
  if (!zone) return res.status(400).json({ error: '温区不存在' })

  const existing = db.prepare('SELECT id FROM products WHERE code = ?').get(value.code)
  if (existing) return res.status(400).json({ error: '货品编码已存在' })

  const result = db.prepare(`
    INSERT INTO products (code, name, customer_id, temperature_zone_id, shelf_life_days, 
                          batch_required, package_type, inspection_required, storage_fee, handling_fee, unit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(value.code, value.name, value.customer_id, value.temperature_zone_id, value.shelf_life_days,
         value.batch_required, value.package_type, value.inspection_required, value.storage_fee, value.handling_fee, value.unit)

  res.json({ id: result.lastInsertRowid, ...value })
})

router.put('/:id', (req, res) => {
  const { error, value } = productSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id)
  if (!product) return res.status(404).json({ error: '货品不存在' })

  const existing = db.prepare('SELECT id FROM products WHERE code = ? AND id != ?').get(value.code, req.params.id)
  if (existing) return res.status(400).json({ error: '货品编码已存在' })

  db.prepare(`
    UPDATE products 
    SET code = ?, name = ?, customer_id = ?, temperature_zone_id = ?, shelf_life_days = ?,
        batch_required = ?, package_type = ?, inspection_required = ?, storage_fee = ?, handling_fee = ?, unit = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(value.code, value.name, value.customer_id, value.temperature_zone_id, value.shelf_life_days,
         value.batch_required, value.package_type, value.inspection_required, value.storage_fee, value.handling_fee, value.unit, req.params.id)

  res.json({ id: req.params.id, ...value })
})

router.delete('/:id', (req, res) => {
  const inventory = db.prepare('SELECT COUNT(*) as count FROM inventory WHERE product_id = ?').get(req.params.id)
  if (inventory.count > 0) return res.status(400).json({ error: '该货品还有库存，无法删除' })

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
