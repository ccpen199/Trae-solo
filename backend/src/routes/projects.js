const express = require('express')
const router = express.Router()
const db = require('../utils/db')

router.get('/', (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, u.name as owner_name 
      FROM projects p 
      LEFT JOIN users u ON p.project_owner_id = u.id 
      ORDER BY p.created_at DESC
    `).all()
    res.json(projects)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { project_owner_id, project_name, project_code } = req.body
    const result = db.prepare(`
      INSERT INTO projects (project_owner_id, project_name, project_code)
      VALUES (?, ?, ?)
    `).run(project_owner_id, project_name, project_code)
    res.json({ id: result.lastInsertRowid, ...req.body })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
    res.json(project)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
