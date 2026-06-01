const express = require('express')
const { auth, requireRole } = require('../middleware/auth')
const router = express.Router()

router.use(auth)

router.get('/', (req, res) => {
  const { app_id, env_id, status, category, keyword } = req.query
  let sql = `SELECT c.*, a.app_name, a.app_code, e.env_name
    FROM configs c
    LEFT JOIN applications a ON a.id = c.app_id
    LEFT JOIN environments e ON e.id = c.env_id
    WHERE 1=1`
  const params = []
  if (app_id) { sql += ' AND c.app_id = ?'; params.push(app_id) }
  if (env_id) { sql += ' AND c.env_id = ?'; params.push(env_id) }
  if (status) { sql += ' AND c.status = ?'; params.push(status) }
  if (category) { sql += ' AND c.category = ?'; params.push(category) }
  if (keyword) { sql += ' AND (c.config_key LIKE ? OR c.config_value LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  sql += ' ORDER BY c.id DESC'
  const rows = req.db.prepare(sql).all(...params)
  res.json({ code: 0, data: rows })
})

router.post('/', requireRole('admin', 'ops', 'owner'), (req, res) => {
  const { app_id, env_id, config_key, config_value, category, description, value_type, effective_from, effective_to, owner, status } = req.body
  if (!app_id || !config_key) return res.status(400).json({ code: 400, message: '应用和配置键必填' })

  // 服务端统一校验：价格/权限/状态类字段
  if (status && !['active', 'inactive', 'pending', 'archived'].includes(status)) {
    return res.status(400).json({ code: 400, message: '状态值非法' })
  }
  if (value_type && !['string', 'number', 'boolean', 'json', 'secret'].includes(value_type)) {
    return res.status(400).json({ code: 400, message: '值类型非法' })
  }

  try {
    const info = req.db.prepare(
      `INSERT INTO configs (app_id, env_id, config_key, config_value, category, description, value_type, effective_from, effective_to, owner, status, version_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).run(app_id, env_id || null, config_key, config_value || null, category || null, description || null, value_type || 'string',
      effective_from || null, effective_to || null, owner || req.user.username, status || 'active')

    req.db.prepare(
      'INSERT INTO config_history (config_id, version_no, config_value, changed_by, change_reason, action) VALUES (?, 1, ?, ?, ?, ?)'
    ).run(info.lastInsertRowid, config_value || null, req.user.username, '初始创建', 'create')

    const row = req.db.prepare('SELECT * FROM configs WHERE id = ?').get(info.lastInsertRowid)
    res.json({ code: 0, data: row })
  } catch (e) {
    res.status(400).json({ code: 400, message: e.message })
  }
})

router.get('/:id', (req, res) => {
  const row = req.db.prepare('SELECT * FROM configs WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ code: 404, message: '不存在' })
  const history = req.db.prepare('SELECT * FROM config_history WHERE config_id = ? ORDER BY id DESC').all(req.params.id)
  res.json({ code: 0, data: { ...row, history } })
})

router.put('/:id', requireRole('admin', 'ops', 'owner'), (req, res) => {
  const { config_value, category, description, status, effective_from, effective_to, change_reason } = req.body
  const current = req.db.prepare('SELECT * FROM configs WHERE id = ?').get(req.params.id)
  if (!current) return res.status(404).json({ code: 404, message: '不存在' })
  if (status && !['active', 'inactive', 'pending', 'archived'].includes(status)) {
    return res.status(400).json({ code: 400, message: '状态值非法' })
  }

  const newVersion = current.version_no + 1
  req.db.prepare(
    `UPDATE configs SET config_value = COALESCE(?, config_value), category = COALESCE(?, category),
     description = COALESCE(?, description), status = COALESCE(?, status),
     effective_from = COALESCE(?, effective_from), effective_to = COALESCE(?, effective_to),
     version_no = ?, updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(config_value || null, category || null, description || null, status || null,
    effective_from || null, effective_to || null, newVersion, req.params.id)

  req.db.prepare(
    'INSERT INTO config_history (config_id, version_no, config_value, changed_by, change_reason, action) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, newVersion, config_value || current.config_value, req.user.username, change_reason || '编辑变更', 'update')

  const row = req.db.prepare('SELECT * FROM configs WHERE id = ?').get(req.params.id)
  res.json({ code: 0, data: row })
})

router.delete('/:id', requireRole('admin', 'owner'), (req, res) => {
  req.db.prepare('DELETE FROM configs WHERE id = ?').run(req.params.id)
  res.json({ code: 0 })
})

router.post('/:id/revert/:version', requireRole('admin', 'ops', 'owner'), (req, res) => {
  const version = req.params.version
  const hist = req.db.prepare('SELECT * FROM config_history WHERE config_id = ? AND version_no = ?').get(req.params.id, version)
  if (!hist) return res.status(404).json({ code: 404, message: '历史版本不存在' })
  const current = req.db.prepare('SELECT * FROM configs WHERE id = ?').get(req.params.id)
  const newVersion = current.version_no + 1
  req.db.prepare(
    `UPDATE configs SET config_value = ?, version_no = ?, updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(hist.config_value, newVersion, req.params.id)
  req.db.prepare(
    'INSERT INTO config_history (config_id, version_no, config_value, changed_by, change_reason, action) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, newVersion, hist.config_value, req.user.username, `回滚至 v${version}`, 'revert')
  res.json({ code: 0 })
})

module.exports = router
