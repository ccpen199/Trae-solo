const express = require('express')
const { db } = require('../database')
const router = express.Router()

router.get('/', (req, res) => {
  const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC')
  const projects = stmt.all()
  res.json(projects)
})

router.get('/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?')
  const project = stmt.get(req.params.id)
  if (!project) {
    return res.status(404).json({ error: '项目不存在' })
  }
  res.json(project)
})

router.post('/', (req, res) => {
  const { budget_source, indicator_no, project_unit, purpose, annual_quota } = req.body
  
  if (!budget_source || !indicator_no || !project_unit || !purpose || !annual_quota) {
    return res.status(400).json({ error: '缺少必填字段' })
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO projects (budget_source, indicator_no, project_unit, purpose, annual_quota, available_balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(budget_source, indicator_no, project_unit, purpose, annual_quota, annual_quota)
    res.json({ id: result.lastInsertRowid, message: '创建成功' })
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '指标文号已存在' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', (req, res) => {
  const { budget_source, indicator_no, project_unit, purpose, annual_quota } = req.body
  
  try {
    const stmt = db.prepare(`
      UPDATE projects 
      SET budget_source = ?, indicator_no = ?, project_unit = ?, purpose = ?, annual_quota = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    const result = stmt.run(budget_source, indicator_no, project_unit, purpose, annual_quota, req.params.id)
    if (result.changes === 0) {
      return res.status(404).json({ error: '项目不存在' })
    }
    res.json({ message: '更新成功' })
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '指标文号已存在' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?')
  const result = stmt.run(req.params.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: '项目不存在' })
  }
  res.json({ message: '删除成功' })
})

module.exports = router
