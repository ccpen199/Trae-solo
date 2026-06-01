const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const db = require('../db')
const { generateNo, logOperation, successResponse, errorResponse } = require('../utils')

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `report_${Date.now()}${ext}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, status, report_type, location } = req.query
  const offset = (page - 1) * pageSize

  let whereSql = []
  let params = []

  if (status) {
    whereSql.push('status = ?')
    params.push(status)
  }
  if (report_type) {
    whereSql.push('report_type = ?')
    params.push(report_type)
  }
  if (location) {
    whereSql.push('location LIKE ?')
    params.push(`%${location}%`)
  }

  const whereClause = whereSql.length > 0 ? `WHERE ${whereSql.join(' AND ')}` : ''

  const total = db.prepare(`SELECT COUNT(*) as count FROM disaster_reports ${whereClause}`).get(...params).count
  const list = db.prepare(`
    SELECT * FROM disaster_reports
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.get('/:id', (req, res) => {
  const { id } = req.params
  const report = db.prepare('SELECT * FROM disaster_reports WHERE id = ?').get(id)
  if (!report) {
    return errorResponse(res, '灾情报告不存在', 404)
  }
  successResponse(res, report)
})

router.post('/', upload.single('photo'), (req, res) => {
  const {
    report_type, location, latitude, longitude,
    deaths, injuries, missing, trapped,
    buildings_destroyed, buildings_damaged, roads_blocked,
    communication_status, water_supply, power_supply,
    reporter_unit, reporter_name, reporter_phone, description
  } = req.body

  if (report_type === undefined || report_type === null || report_type === '' ||
      location === undefined || location === null || location === '' ||
      reporter_unit === undefined || reporter_unit === null || reporter_unit === '') {
    return errorResponse(res, '请填写必填项：灾情类型、地点、上报单位')
  }

  const report_no = generateNo('DR')
  let photo_path = null
  if (req.file) {
    photo_path = `/uploads/${req.file.filename}`
  }

  const stmt = db.prepare(`
    INSERT INTO disaster_reports (
      report_no, report_type, location, latitude, longitude,
      deaths, injuries, missing, trapped,
      buildings_destroyed, buildings_damaged, roads_blocked,
      communication_status, water_supply, power_supply,
      photo_path, reporter_unit, reporter_name, reporter_phone, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    report_no, report_type, location, latitude, longitude,
    deaths || 0, injuries || 0, missing || 0, trapped || 0,
    buildings_destroyed || 0, buildings_damaged || 0, roads_blocked,
    communication_status, water_supply, power_supply,
    photo_path, reporter_unit, reporter_name, reporter_phone, description
  )

  logOperation('disaster', 'create', result.lastInsertRowid, reporter_name || 'system', req.ip, req.body)
  successResponse(res, { id: result.lastInsertRowid, report_no }, '上报成功')
})

router.put('/:id', (req, res) => {
  const { id } = req.params
  const {
    status, deaths, injuries, missing, trapped,
    buildings_destroyed, buildings_damaged, roads_blocked,
    communication_status, water_supply, power_supply, description,
    handler, handle_result
  } = req.body

  const existing = db.prepare('SELECT * FROM disaster_reports WHERE id = ?').get(id)
  if (!existing) {
    return errorResponse(res, '灾情报告不存在', 404)
  }

  const oldStatus = existing.status

  const stmt = db.prepare(`
    UPDATE disaster_reports SET
      status = COALESCE(?, status),
      deaths = COALESCE(?, deaths),
      injuries = COALESCE(?, injuries),
      missing = COALESCE(?, missing),
      trapped = COALESCE(?, trapped),
      buildings_destroyed = COALESCE(?, buildings_destroyed),
      buildings_damaged = COALESCE(?, buildings_damaged),
      roads_blocked = COALESCE(?, roads_blocked),
      communication_status = COALESCE(?, communication_status),
      water_supply = COALESCE(?, water_supply),
      power_supply = COALESCE(?, power_supply),
      description = COALESCE(?, description),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)

  stmt.run(
    status, deaths, injuries, missing, trapped,
    buildings_destroyed, buildings_damaged, roads_blocked,
    communication_status, water_supply, power_supply, description, id
  )

  const logDetails = {
    old_status: oldStatus,
    new_status: status,
    handler: handler || 'system',
    handle_result: handle_result || description,
    ...req.body
  }
  logOperation('disaster', status === 'completed' ? 'complete' : 'process', id, handler || 'system', req.ip, logDetails)

  const updated = db.prepare('SELECT * FROM disaster_reports WHERE id = ?').get(id)
  successResponse(res, updated, '处理成功，已记录复查结论')
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.prepare('DELETE FROM disaster_reports WHERE id = ?').run(id)
  logOperation('disaster', 'delete', id, 'system', req.ip, { id })
  successResponse(res, null, '删除成功')
})

router.post('/:id/photo', upload.single('photo'), (req, res) => {
  const { id } = req.params
  if (!req.file) {
    return errorResponse(res, '请选择要上传的照片')
  }

  const photo_path = `/uploads/${req.file.filename}`
  db.prepare('UPDATE disaster_reports SET photo_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(photo_path, id)

  logOperation('disaster', 'upload_photo', id, 'system', req.ip, { photo_path })
  successResponse(res, { photo_path }, '照片上传成功')
})

module.exports = router
