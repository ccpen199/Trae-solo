const express = require('express')
const { auth } = require('../middleware/auth')
const router = express.Router()

router.use(auth)

function now() { return new Date().toISOString().replace('T', ' ').substring(0, 19) }

// 获取可见的应用目录列表（基于可见范围）
router.get('/', (req, res) => {
  const { category, keyword } = req.query
  const user = req.user

  // 先获取所有应用，再在内存中按可见范围过滤
  let sql = 'SELECT c.* FROM app_catalog c WHERE 1=1'
  const params = []
  if (category) { sql += ' AND c.category = ?'; params.push(category) }
  if (keyword) { sql += ' AND (c.app_name LIKE ? OR c.description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  sql += ' ORDER BY c.sort_weight ASC, c.id ASC'

  const all = req.db.prepare(sql).all(...params)

  // 在内存中过滤可见范围
  const visible = all.filter(app => {
    if (!app.visible_scope || app.visible_scope === 'all') return true
    if (app.visible_scope === 'login') return true
    if (app.visible_scope.startsWith('role:')) {
      const roles = app.visible_scope.slice(5).split(',')
      return roles.includes(user.role)
    }
    if (app.visible_scope.startsWith('department:')) {
      const depts = app.visible_scope.slice(11).split(',')
      const userDept = user.department || ''
      return depts.includes(userDept)
    }
    return true
  })

  // 查询我是否已收藏
  const favoriteIds = req.db.prepare('SELECT catalog_id FROM app_favorites WHERE user_id = ?')
    .all(req.user.id).map(r => r.catalog_id)

  // 查询最近访问
  const recentIds = req.db.prepare('SELECT catalog_id FROM app_recent_access WHERE user_id = ? ORDER BY accessed_at DESC LIMIT 10')
    .all(req.user.id).map(r => r.catalog_id)

  const result = visible.map(a => ({
    ...a,
    is_favorite: favoriteIds.includes(a.id),
    is_recent: recentIds.includes(a.id)
  }))

  // 获取分类统计
  const catStats = req.db.prepare(`
    SELECT category, COUNT(*) AS count FROM app_catalog
    WHERE maintenance_status = 'online'
    GROUP BY category ORDER BY COUNT(*) DESC
  `).all()

  res.json({ code: 0, data: { list: result, categories: catStats, favorites: favoriteIds, recent: recentIds } })
})

// 获取单个应用详情
router.get('/:id', (req, res) => {
  const row = req.db.prepare('SELECT * FROM app_catalog WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ code: 404, message: '不存在' })
  res.json({ code: 0, data: row })
})

// 访问应用（记录最近访问）
router.post('/:id/visit', (req, res) => {
  const row = req.db.prepare('SELECT * FROM app_catalog WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ code: 404, message: '不存在' })

  // 检查是否需要权限
  if (row.approval_required === 1) {
    const perm = req.db.prepare(`
      SELECT * FROM permission_requests
      WHERE catalog_id = ? AND applicant_id = ? AND status = 'approved'
        AND (valid_to IS NULL OR valid_to >= datetime('now','localtime'))
      ORDER BY id DESC LIMIT 1
    `).get(req.params.id, req.user.id)
    if (!perm) {
      return res.status(403).json({ code: 403, message: '需要先申请权限', requireApproval: true })
    }
  }

  // 记录最近访问
  req.db.prepare(`
    INSERT OR REPLACE INTO app_recent_access (user_id, username, catalog_id, accessed_at)
    VALUES (?, ?, ?, datetime('now','localtime'))
  `).run(req.user.id, req.user.username, req.params.id)

  res.json({ code: 0, data: { access_url: row.access_url } })
})

// 收藏/取消收藏
router.post('/:id/favorite', (req, res) => {
  const exists = req.db.prepare('SELECT id FROM app_favorites WHERE user_id = ? AND catalog_id = ?').get(req.user.id, req.params.id)
  if (exists) {
    req.db.prepare('DELETE FROM app_favorites WHERE id = ?').run(exists.id)
    res.json({ code: 0, data: { is_favorite: false } })
  } else {
    req.db.prepare('INSERT INTO app_favorites (user_id, username, catalog_id) VALUES (?, ?, ?)')
      .run(req.user.id, req.user.username, req.params.id)
    res.json({ code: 0, data: { is_favorite: true } })
  }
})

// 获取我收藏的应用
router.get('/me/favorites', (req, res) => {
  const rows = req.db.prepare(`
    SELECT c.* FROM app_catalog c
    INNER JOIN app_favorites f ON f.catalog_id = c.id
    WHERE f.user_id = ?
    ORDER BY f.id DESC
  `).all(req.user.id)
  res.json({ code: 0, data: rows })
})

// 获取最近访问
router.get('/me/recent', (req, res) => {
  const rows = req.db.prepare(`
    SELECT c.*, r.accessed_at FROM app_catalog c
    INNER JOIN app_recent_access r ON r.catalog_id = c.id
    WHERE r.user_id = ?
    ORDER BY r.accessed_at DESC LIMIT 10
  `).all(req.user.id)
  res.json({ code: 0, data: rows })
})

// 获取公告
router.get('/announcements/list', (req, res) => {
  const rows = req.db.prepare(`
    SELECT * FROM announcements WHERE status = 'published' ORDER BY id DESC LIMIT 20
  `).all()
  res.json({ code: 0, data: rows })
})

module.exports = router
