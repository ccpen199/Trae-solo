const express = require('express')
const { db } = require('../database')
const router = express.Router()

router.get('/', (req, res) => {
  const { status, type } = req.query
  let sql = `
    SELECT e.*
    FROM exception_orders e
    WHERE 1=1
  `
  const params = []
  if (status) {
    sql += ' AND e.status = ?'
    params.push(status)
  }
  if (type) {
    sql += ' AND e.type = ?'
    params.push(type)
  }
  sql += ' ORDER BY e.created_at DESC'
  const exceptions = db.prepare(sql).all(...params)
  res.json(exceptions)
})

router.post('/:id/handle', (req, res) => {
  const { handling_result } = req.body
  db.prepare(`
    UPDATE exception_orders 
    SET status = 'handled', 
        handling_result = ?,
        handled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(handling_result, req.params.id)
  res.json({ success: true })
})

module.exports = router
