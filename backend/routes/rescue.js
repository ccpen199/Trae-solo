const express = require('express')
const db = require('../db')
const { generateNo, logOperation, successResponse, errorResponse } = require('../utils')

const router = express.Router()

router.get('/teams', (req, res) => {
  const { status } = req.query
  let sql = 'SELECT * FROM rescue_teams'
  let params = []
  if (status) {
    sql += ' WHERE status = ?'
    params.push(status)
  }
  sql += ' ORDER BY created_at DESC'
  const list = db.prepare(sql).all(...params)
  successResponse(res, list)
})

router.post('/teams', (req, res) => {
  const { team_code, team_name, team_type, person_count, leader_name, leader_phone, base_location } = req.body
  if (!team_code || !team_name) {
    return errorResponse(res, '缺少必要参数')
  }

  const stmt = db.prepare(`
    INSERT INTO rescue_teams (team_code, team_name, team_type, person_count, leader_name, leader_phone, base_location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(team_code, team_name, team_type, person_count, leader_name, leader_phone, base_location)
  logOperation('rescue', 'create_team', result.lastInsertRowid, 'system', req.ip, req.body)
  successResponse(res, { id: result.lastInsertRowid }, '队伍创建成功')
})

router.put('/teams/:id', (req, res) => {
  const { id } = req.params
  const { team_name, team_type, person_count, leader_name, leader_phone, base_location, status } = req.body

  const existing = db.prepare('SELECT * FROM rescue_teams WHERE id = ?').get(id)
  if (!existing) {
    return errorResponse(res, '队伍不存在', 404)
  }

  const stmt = db.prepare(`
    UPDATE rescue_teams SET
      team_name = COALESCE(?, team_name),
      team_type = COALESCE(?, team_type),
      person_count = COALESCE(?, person_count),
      leader_name = COALESCE(?, leader_name),
      leader_phone = COALESCE(?, leader_phone),
      base_location = COALESCE(?, base_location),
      status = COALESCE(?, status)
    WHERE id = ?
  `)
  stmt.run(team_name, team_type, person_count, leader_name, leader_phone, base_location, status, id)
  logOperation('rescue', 'update_team', id, 'system', req.ip, req.body)
  successResponse(res, null, '更新成功')
})

router.get('/vehicles', (req, res) => {
  const list = db.prepare(`
    SELECT v.*, t.team_name FROM vehicles v
    LEFT JOIN rescue_teams t ON v.team_id = t.id
    ORDER BY v.id DESC
  `).all()
  successResponse(res, list)
})

router.post('/vehicles', (req, res) => {
  const { plate_no, vehicle_type, capacity, team_id, current_location } = req.body
  if (!plate_no) {
    return errorResponse(res, '缺少必要参数')
  }

  const stmt = db.prepare(`
    INSERT INTO vehicles (plate_no, vehicle_type, capacity, team_id, current_location)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(plate_no, vehicle_type, capacity, team_id, current_location)
  logOperation('rescue', 'create_vehicle', result.lastInsertRowid, 'system', req.ip, req.body)
  successResponse(res, { id: result.lastInsertRowid }, '车辆创建成功')
})

router.get('/missions', (req, res) => {
  const { page = 1, pageSize = 10, status, priority } = req.query
  const offset = (page - 1) * pageSize

  let whereSql = []
  let params = []
  if (status) {
    whereSql.push('m.status = ?')
    params.push(status)
  }
  if (priority) {
    whereSql.push('m.priority = ?')
    params.push(priority)
  }
  const whereClause = whereSql.length > 0 ? `WHERE ${whereSql.join(' AND ')}` : ''

  const total = db.prepare(`SELECT COUNT(*) as count FROM missions m ${whereClause}`).get(...params).count
  const list = db.prepare(`
    SELECT m.*, t.team_name, t.leader_name
    FROM missions m
    LEFT JOIN rescue_teams t ON m.team_id = t.id
    ${whereClause}
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.get('/missions/:id', (req, res) => {
  const { id } = req.params
  const mission = db.prepare(`
    SELECT m.*, t.team_name, t.leader_name, t.leader_phone
    FROM missions m
    LEFT JOIN rescue_teams t ON m.team_id = t.id
    WHERE m.id = ?
  `).get(id)

  if (!mission) {
    return errorResponse(res, '任务不存在', 404)
  }

  const tracks = db.prepare(`
    SELECT mt.*, t1.team_name as old_team_name, t2.team_name as new_team_name
    FROM mission_tracks mt
    LEFT JOIN rescue_teams t1 ON mt.old_team_id = t1.id
    LEFT JOIN rescue_teams t2 ON mt.new_team_id = t2.id
    WHERE mt.mission_id = ?
    ORDER BY mt.created_at DESC
  `).all(id)

  successResponse(res, { mission, tracks })
})

router.post('/missions', (req, res) => {
  const { mission_type, description, target_location, latitude, longitude, priority, team_id, assigned_resources, created_by } = req.body
  if (mission_type === undefined || mission_type === null || mission_type === '' ||
      target_location === undefined || target_location === null || target_location === '') {
    return errorResponse(res, '请填写必填项：任务类型、目标地点')
  }

  const mission_no = generateNo('MS')
  const stmt = db.prepare(`
    INSERT INTO missions (
      mission_no, mission_type, description, target_location, latitude, longitude,
      priority, team_id, assigned_resources, created_by, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const newStatus = team_id ? 'assigned' : 'pending'
  const result = stmt.run(
    mission_no, mission_type, description, target_location, latitude, longitude,
    priority || 'normal', team_id, assigned_resources, created_by, newStatus
  )

  if (team_id) {
    db.prepare('UPDATE rescue_teams SET status = ? WHERE id = ?').run('assigned', team_id)
  }

  const newMission = db.prepare(`
    SELECT m.*, t.team_name, t.leader_name
    FROM missions m
    LEFT JOIN rescue_teams t ON m.team_id = t.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid)

  logOperation('rescue', 'create_mission', result.lastInsertRowid, created_by || 'system', req.ip, req.body)
  successResponse(res, newMission, '任务创建成功，已生成调度记录')
})

router.put('/missions/:id', (req, res) => {
  const { id } = req.params
  const { status, team_id, departure_time, arrival_time, completion_time, operator, change_reason } = req.body

  const existing = db.prepare('SELECT * FROM missions WHERE id = ?').get(id)
  if (!existing) {
    return errorResponse(res, '任务不存在', 404)
  }

  if (status === undefined || status === null || status === '') {
    return errorResponse(res, '请选择新状态')
  }

  const stmt = db.prepare(`
    UPDATE missions SET
      status = COALESCE(?, status),
      team_id = COALESCE(?, team_id),
      departure_time = COALESCE(?, departure_time),
      arrival_time = COALESCE(?, arrival_time),
      completion_time = COALESCE(?, completion_time),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(status, team_id, departure_time, arrival_time, completion_time, id)

  const trackStmt = db.prepare(`
    INSERT INTO mission_tracks (mission_id, old_status, new_status, old_team_id, new_team_id, change_reason, operator)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  trackStmt.run(
    id, existing.status, status || existing.status,
    existing.team_id, team_id || existing.team_id,
    change_reason || `${existing.status} → ${status}`,
    operator || 'system'
  )

  if (team_id && team_id !== existing.team_id) {
    if (existing.team_id) {
      db.prepare('UPDATE rescue_teams SET status = ? WHERE id = ?').run('standby', existing.team_id)
    }
    db.prepare('UPDATE rescue_teams SET status = ? WHERE id = ?').run('assigned', team_id)
  }

  if (status === 'completed' || status === 'cancelled') {
    if (existing.team_id) {
      db.prepare('UPDATE rescue_teams SET status = ? WHERE id = ?').run('standby', existing.team_id)
    }
  }

  const updatedMission = db.prepare(`
    SELECT m.*, t.team_name, t.leader_name
    FROM missions m
    LEFT JOIN rescue_teams t ON m.team_id = t.id
    WHERE m.id = ?
  `).get(id)

  const tracks = db.prepare('SELECT * FROM mission_tracks WHERE mission_id = ? ORDER BY created_at DESC').all(id)

  logOperation('rescue', `status_${status}`, id, operator || 'system', req.ip, {
    old_status: existing.status,
    new_status: status,
    change_reason: change_reason || `${existing.status} → ${status}`
  })

  successResponse(res, { mission: updatedMission, tracks }, '状态更新成功，已记录变更轨迹')
})

router.delete('/missions/:id', (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM missions WHERE id = ?').get(id)
  if (!existing) {
    return errorResponse(res, '任务不存在', 404)
  }

  db.prepare('DELETE FROM mission_tracks WHERE mission_id = ?').run(id)
  db.prepare('DELETE FROM missions WHERE id = ?').run(id)

  if (existing.team_id) {
    db.prepare('UPDATE rescue_teams SET status = ? WHERE id = ?').run('standby', existing.team_id)
  }

  logOperation('rescue', 'delete_mission', id, 'system', req.ip, { id })
  successResponse(res, null, '删除成功')
})

module.exports = router
