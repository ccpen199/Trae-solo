const express = require('express')
const db = require('../db')
const { generateNo, logOperation, successResponse, errorResponse } = require('../utils')

const router = express.Router()

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query
  const offset = (page - 1) * pageSize

  const total = db.prepare('SELECT COUNT(*) as count FROM earthquakes').get().count
  const list = db.prepare(`
    SELECT * FROM earthquakes
    ORDER BY occurred_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset)

  successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.get('/latest', (req, res) => {
  const eq = db.prepare(`
    SELECT * FROM earthquakes
    ORDER BY occurred_at DESC
    LIMIT 1
  `).get()

  if (!eq) {
    return successResponse(res, null)
  }

  const aftershocks = db.prepare(`
    SELECT * FROM aftershocks
    WHERE earthquake_id = ?
    ORDER BY occurred_at DESC
    LIMIT 20
  `).all(eq.id)

  const keyAreas = db.prepare(`
    SELECT * FROM key_areas
    WHERE earthquake_id = ? OR earthquake_id IS NULL
    ORDER BY risk_level DESC
  `).all(eq.id)

  successResponse(res, {
    earthquake: eq,
    aftershocks,
    keyAreas
  })
})

router.get('/:id', (req, res) => {
  const { id } = req.params
  const eq = db.prepare('SELECT * FROM earthquakes WHERE id = ?').get(id)
  if (!eq) {
    return errorResponse(res, '地震记录不存在', 404)
  }

  const aftershocks = db.prepare(`
    SELECT * FROM aftershocks
    WHERE earthquake_id = ?
    ORDER BY occurred_at DESC
  `).all(id)

  const keyAreas = db.prepare(`
    SELECT * FROM key_areas
    WHERE earthquake_id = ?
    ORDER BY risk_level DESC
  `).all(id)

  successResponse(res, { earthquake: eq, aftershocks, keyAreas })
})

router.post('/', (req, res) => {
  const { magnitude, latitude, longitude, depth, location, occurred_at, intensity_estimate, affected_radius } = req.body

  if (magnitude === undefined || magnitude === null ||
      latitude === undefined || latitude === null ||
      longitude === undefined || longitude === null ||
      depth === undefined || depth === null ||
      location === undefined || location === null || location === '' ||
      occurred_at === undefined || occurred_at === null || occurred_at === '') {
    return errorResponse(res, '请填写必填项：震级、经纬度、深度、位置、发生时间')
  }

  const stmt = db.prepare(`
    INSERT INTO earthquakes (magnitude, latitude, longitude, depth, location, occurred_at, intensity_estimate, affected_radius)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(magnitude, latitude, longitude, depth, location, occurred_at, intensity_estimate, affected_radius)

  const newEq = db.prepare('SELECT * FROM earthquakes WHERE id = ?').get(result.lastInsertRowid)
  logOperation('earthquake', 'create', result.lastInsertRowid, 'system', req.ip, req.body)
  successResponse(res, newEq, '地震记录创建成功')
})

router.post('/aftershocks', (req, res) => {
  const { earthquake_id, magnitude, latitude, longitude, depth, occurred_at } = req.body

  if (!earthquake_id || !magnitude || !latitude || !longitude || !occurred_at) {
    return errorResponse(res, '缺少必要参数')
  }

  const stmt = db.prepare(`
    INSERT INTO aftershocks (earthquake_id, magnitude, latitude, longitude, depth, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(earthquake_id, magnitude, latitude, longitude, depth, occurred_at)

  logOperation('earthquake', 'add_aftershock', result.lastInsertRowid, 'system', req.ip, req.body)
  successResponse(res, { id: result.lastInsertRowid }, '余震记录添加成功')
})

router.post('/key-areas', (req, res) => {
  const { earthquake_id, name, latitude, longitude, risk_level, population, description } = req.body

  if (!name) {
    return errorResponse(res, '缺少必要参数')
  }

  const stmt = db.prepare(`
    INSERT INTO key_areas (earthquake_id, name, latitude, longitude, risk_level, population, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(earthquake_id, name, latitude, longitude, risk_level, population, description)

  logOperation('earthquake', 'add_key_area', result.lastInsertRowid, 'system', req.ip, req.body)
  successResponse(res, { id: result.lastInsertRowid }, '重点区域添加成功')
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM aftershocks WHERE earthquake_id = ?').run(id)
  db.prepare('DELETE FROM key_areas WHERE earthquake_id = ?').run(id)
  db.prepare('DELETE FROM earthquakes WHERE id = ?').run(id)
  logOperation('earthquake', 'delete', id, 'system', req.ip, { id })
  successResponse(res, null, '删除成功')
})

module.exports = router
