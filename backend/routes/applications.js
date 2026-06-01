const express = require('express')
const { auth, requireRole } = require('../middleware/auth')
const router = express.Router()

router.use(auth)

router.get('/', (req, res) => {
  const { status, keyword } = req.query
  let sql = 'SELECT * FROM applications WHERE 1=1'
  const params = []
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (keyword) { sql += ' AND (app_code LIKE ? OR app_name LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  sql += ' ORDER BY id DESC'
  const rows = req.db.prepare(sql).all(...params)
  res.json({ code: 0, data: rows })
})

router.post('/', requireRole('admin', 'platform', 'owner'), (req, res) => {
  const { app_code, app_name, owner, category, description, status } = req.body
  if (!app_code || !app_name) return res.status(400).json({ code: 400, message: '应用编码和名称必填' })
  try {
    const info = req.db.prepare(
      'INSERT INTO applications (app_code, app_name, owner, category, description, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(app_code, app_name, owner || null, category || null, description || null, status || 'active', req.user.username)
    const row = req.db.prepare('SELECT * FROM applications WHERE id = ?').get(info.lastInsertRowid)
    res.json({ code: 0, data: row })
  } catch (e) {
    res.status(400).json({ code: 400, message: e.message })
  }
})

router.get('/:id', (req, res) => {
  const row = req.db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ code: 404, message: '不存在' })
  const envs = req.db.prepare('SELECT * FROM environments WHERE app_id = ? ORDER BY id').all(req.params.id)
  const configs = req.db.prepare('SELECT * FROM configs WHERE app_id = ? ORDER BY id DESC LIMIT 50').all(req.params.id)
  const versions = req.db.prepare('SELECT * FROM versions WHERE app_id = ? ORDER BY id DESC LIMIT 20').all(req.params.id)
  const secrets = req.db.prepare('SELECT id, app_id, env_id, key_name, description, expiry, created_by, created_at FROM secrets WHERE app_id = ?').all(req.params.id)
  res.json({ code: 0, data: { ...row, environments: envs, configs, versions, secrets } })
})

router.put('/:id', requireRole('admin', 'platform', 'owner'), (req, res) => {
  const { app_name, owner, category, description, status } = req.body
  req.db.prepare(
    "UPDATE applications SET app_name = COALESCE(?, app_name), owner = COALESCE(?, owner), category = COALESCE(?, category), description = COALESCE(?, description), status = COALESCE(?, status), updated_at = datetime('now','localtime') WHERE id = ?"
  ).run(app_name || null, owner || null, category || null, description || null, status || null, req.params.id)
  const row = req.db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id)
  res.json({ code: 0, data: row })
})

router.delete('/:id', requireRole('admin'), (req, res) => {
  req.db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id)
  res.json({ code: 0 })
})

// Environments
router.get('/:id/environments', (req, res) => {
  const rows = req.db.prepare('SELECT * FROM environments WHERE app_id = ? ORDER BY id').all(req.params.id)
  res.json({ code: 0, data: rows })
})

router.post('/:id/environments', requireRole('admin', 'platform', 'ops'), (req, res) => {
  const { env_name, env_type, base_url, status } = req.body
  if (!env_name) return res.status(400).json({ code: 400, message: '环境名称必填' })
  const info = req.db.prepare(
    'INSERT INTO environments (app_id, env_name, env_type, base_url, status) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, env_name, env_type || 'dev', base_url || null, status || 'active')
  const row = req.db.prepare('SELECT * FROM environments WHERE id = ?').get(info.lastInsertRowid)
  res.json({ code: 0, data: row })
})

router.delete('/environments/:eid', requireRole('admin', 'platform'), (req, res) => {
  req.db.prepare('DELETE FROM environments WHERE id = ?').run(req.params.eid)
  res.json({ code: 0 })
})

// Versions
router.get('/:id/versions', (req, res) => {
  const rows = req.db.prepare('SELECT * FROM versions WHERE app_id = ? ORDER BY id DESC').all(req.params.id)
  res.json({ code: 0, data: rows })
})

router.post('/:id/versions', requireRole('admin', 'platform', 'dev', 'owner'), (req, res) => {
  const { version, changelog, artifact, status } = req.body
  if (!version) return res.status(400).json({ code: 400, message: '版本号必填' })
  const info = req.db.prepare(
    'INSERT INTO versions (app_id, version, changelog, artifact, published_by, status, published_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\',\'localtime\'))'
  ).run(req.params.id, version, changelog || null, artifact || null, req.user.username, status || 'draft')
  res.json({ code: 0, data: req.db.prepare('SELECT * FROM versions WHERE id = ?').get(info.lastInsertRowid) })
})

// Secrets
router.get('/:id/secrets', requireRole('admin', 'security', 'owner'), (req, res) => {
  const rows = req.db.prepare('SELECT * FROM secrets WHERE app_id = ? ORDER BY id DESC').all(req.params.id)
  res.json({ code: 0, data: rows })
})

router.post('/:id/secrets', requireRole('admin', 'security', 'owner'), (req, res) => {
  const { env_id, key_name, value, description, expiry } = req.body
  if (!key_name || !value) return res.status(400).json({ code: 400, message: '键和值必填' })
  const info = req.db.prepare(
    'INSERT INTO secrets (app_id, env_id, key_name, value, description, expiry, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, env_id || null, key_name, value, description || null, expiry || null, req.user.username)
  res.json({ code: 0, data: req.db.prepare('SELECT id, app_id, env_id, key_name, description, expiry, created_by, created_at FROM secrets WHERE id = ?').get(info.lastInsertRowid) })
})

router.delete('/secrets/:sid', requireRole('admin', 'security'), (req, res) => {
  req.db.prepare('DELETE FROM secrets WHERE id = ?').run(req.params.sid)
  res.json({ code: 0 })
})

module.exports = router
