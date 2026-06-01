const express = require('express')
const db = require('../database/init')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/', (req, res) => {
  const { business_domain, parent_id } = req.query
  
  let query = 'SELECT * FROM categories'
  const params = []
  
  if (business_domain) {
    query += ' WHERE business_domain = ?'
    params.push(business_domain)
  }
  
  if (parent_id !== undefined) {
    query += params.length ? ' AND parent_id = ?' : ' WHERE parent_id = ?'
    params.push(parseInt(parent_id))
  }
  
  query += ' ORDER BY sort_order ASC, id ASC'
  
  const categories = db.prepare(query).all(...params)
  res.json(categories)
})

router.get('/tree', (req, res) => {
  const allCategories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all()
  
  const buildTree = (parentId = 0) => {
    return allCategories
      .filter(c => c.parent_id === parentId)
      .map(c => ({
        ...c,
        children: buildTree(c.id)
      }))
  }
  
  res.json(buildTree())
})

router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { name, parent_id, business_domain, icon, sort_order } = req.body
  
  if (!name || !business_domain) {
    return res.status(400).json({ error: '名称和业务域不能为空' })
  }

  const result = db.prepare(`
    INSERT INTO categories (name, parent_id, business_domain, icon, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, parent_id || 0, business_domain, icon, sort_order || 0)

  res.json({ id: result.lastInsertRowid })
})

module.exports = router
