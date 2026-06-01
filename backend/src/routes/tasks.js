const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const multer = require('multer')
const csv = require('csv-parser')
const fs = require('fs')
const path = require('path')

const upload = multer({ dest: path.join(__dirname, '../../uploads') })

router.get('/batches', (req, res) => {
  try {
    const batches = db.prepare(`
      SELECT tb.*, p.project_name, u.name as creator_name
      FROM task_batches tb
      LEFT JOIN projects p ON tb.project_id = p.id
      LEFT JOIN users u ON tb.created_by = u.id
      ORDER BY tb.created_at DESC
    `).all()
    res.json(batches)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/batches', (req, res) => {
  try {
    const { project_id, batch_name } = req.body
    const batch_no = 'BATCH' + Date.now()
    const result = db.prepare(`
      INSERT INTO task_batches (project_id, batch_no, batch_name, created_by)
      VALUES (?, ?, ?, ?)
    `).run(project_id, batch_no, batch_name, 1)
    res.json({ id: result.lastInsertRowid, batch_no, ...req.body })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', (req, res) => {
  try {
    const { batch_id, freelancer_id, acceptance_status } = req.query
    let sql = `
      SELECT t.*, tb.batch_name, p.project_name, u.name as freelancer_name, u2.name as acceptor_name
      FROM tasks t
      LEFT JOIN task_batches tb ON t.batch_id = tb.id
      LEFT JOIN projects p ON tb.project_id = p.id
      LEFT JOIN users u ON t.freelancer_id = u.id
      LEFT JOIN users u2 ON t.accepted_by = u2.id
      WHERE 1=1
    `
    const params = []
    if (batch_id) {
      sql += ' AND t.batch_id = ?'
      params.push(batch_id)
    }
    if (freelancer_id) {
      sql += ' AND t.freelancer_id = ?'
      params.push(freelancer_id)
    }
    if (acceptance_status) {
      sql += ' AND t.acceptance_status = ?'
      params.push(acceptance_status)
    }
    sql += ' ORDER BY t.created_at DESC'
    const tasks = db.prepare(sql).all(...params)
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/import/:batchId', upload.single('file'), (req, res) => {
  const batchId = req.params.batchId
  const results = []
  const errors = []
  let rowNumber = 0

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      rowNumber++
      results.push({ ...data, rowNumber })
    })
    .on('end', () => {
      const insertTask = db.prepare(`
        INSERT INTO tasks (batch_id, freelancer_id, task_no, task_content, unit_price, quantity, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      const insertError = db.prepare(`
        INSERT INTO import_errors (batch_id, row_number, error_message, row_data)
        VALUES (?, ?, ?, ?)
      `)
      let successCount = 0

      for (const row of results) {
        try {
          if (!row.freelancer_id || !row.task_no || !row.unit_price || !row.quantity) {
            throw new Error('缺少必填字段')
          }
          const freelancer = db.prepare('SELECT id FROM users WHERE id = ? AND user_type = ?').get(row.freelancer_id, 'freelancer')
          if (!freelancer) {
            throw new Error('自由职业者不存在')
          }
          const unitPrice = parseFloat(row.unit_price)
          const quantity = parseInt(row.quantity)
          insertTask.run(batchId, row.freelancer_id, row.task_no, row.task_content || '', unitPrice, quantity, unitPrice * quantity)
          successCount++
        } catch (err) {
          errors.push({ rowNumber: row.rowNumber, error: err.message, data: row })
          insertError.run(batchId, row.rowNumber, err.message, JSON.stringify(row))
        }
      }

      db.prepare('UPDATE task_batches SET total_tasks = total_tasks + ?, status = ? WHERE id = ?').run(successCount, 'completed', batchId)
      fs.unlinkSync(req.file.path)

      res.json({
        success: successCount,
        failed: errors.length,
        errors: errors
      })
    })
})

router.get('/import-errors/:batchId', (req, res) => {
  try {
    const errors = db.prepare('SELECT * FROM import_errors WHERE batch_id = ? ORDER BY row_number').all(req.params.batchId)
    res.json(errors)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/accept', (req, res) => {
  try {
    const { accepted_by } = req.body
    db.prepare(`
      UPDATE tasks SET acceptance_status = 'approved', accepted_by = ?, accepted_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(accepted_by || 1, req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/reject', (req, res) => {
  try {
    const { rejection_reason, rejected_by } = req.body
    db.prepare(`
      UPDATE tasks SET acceptance_status = 'rejected', rejection_reason = ?, accepted_by = ?, accepted_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(rejection_reason, rejected_by || 1, req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
