const express = require('express')
const router = express.Router()
const db = require('../utils/db')

router.get('/', (req, res) => {
  try {
    const { freelancer_id, project_id, voucher_type } = req.query
    let sql = `
      SELECT v.*, u.name as freelancer_name, p.project_name
      FROM vouchers v
      LEFT JOIN users u ON v.freelancer_id = u.id
      LEFT JOIN projects p ON v.project_id = p.id
      WHERE 1=1
    `
    const params = []
    if (freelancer_id) {
      sql += ' AND v.freelancer_id = ?'
      params.push(freelancer_id)
    }
    if (project_id) {
      sql += ' AND v.project_id = ?'
      params.push(project_id)
    }
    if (voucher_type) {
      sql += ' AND v.voucher_type = ?'
      params.push(voucher_type)
    }
    sql += ' ORDER BY v.created_at DESC'
    const vouchers = db.prepare(sql).all(...params)
    res.json(vouchers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { voucher_type, related_id, freelancer_id, project_id } = req.body
    const voucher_no = 'VOU' + Date.now()
    const result = db.prepare(`
      INSERT INTO vouchers (voucher_no, voucher_type, related_id, freelancer_id, project_id, file_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(voucher_no, voucher_type, related_id, freelancer_id, project_id, '/vouchers/' + voucher_no + '.pdf')
    res.json({ id: result.lastInsertRowid, voucher_no })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
