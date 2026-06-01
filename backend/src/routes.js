const express = require('express')
const db = require('./database')

const router = express.Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all()
  res.json(products)
})

router.post('/products', (req, res) => {
  const { code, name, description } = req.body
  try {
    const result = db.prepare('INSERT INTO products (code, name, description) VALUES (?, ?, ?)').run(code, name, description)
    res.json({ id: result.lastInsertRowid, code, name, description })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/stations', (req, res) => {
  const stations = db.prepare(`
    SELECT s.*, 
           (SELECT COUNT(*) FROM cameras c WHERE c.station_id = s.id) as camera_count
    FROM stations s 
    ORDER BY created_at DESC
  `).all()
  res.json(stations)
})

router.post('/stations', (req, res) => {
  const { code, name, line, description } = req.body
  try {
    const result = db.prepare('INSERT INTO stations (code, name, line, description) VALUES (?, ?, ?, ?)').run(code, name, line, description)
    res.json({ id: result.lastInsertRowid, code, name, line, description })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/cameras', (req, res) => {
  const cameras = db.prepare(`
    SELECT c.*, s.name as station_name, s.code as station_code
    FROM cameras c 
    LEFT JOIN stations s ON c.station_id = s.id
    ORDER BY created_at DESC
  `).all()
  res.json(cameras)
})

router.post('/cameras', (req, res) => {
  const { code, name, station_id, ip_address } = req.body
  try {
    const result = db.prepare('INSERT INTO cameras (code, name, station_id, ip_address) VALUES (?, ?, ?, ?)').run(code, name, station_id, ip_address)
    res.json({ id: result.lastInsertRowid, code, name, station_id, ip_address })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/model-versions', (req, res) => {
  const models = db.prepare('SELECT * FROM model_versions ORDER BY created_at DESC').all()
  res.json(models)
})

router.post('/model-versions', (req, res) => {
  const { name, version, status, description } = req.body
  try {
    const result = db.prepare('INSERT INTO model_versions (name, version, status, description) VALUES (?, ?, ?, ?)').run(name, version, status, description)
    res.json({ id: result.lastInsertRowid, name, version, status, description })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/model-versions/:id/publish', (req, res) => {
  const { id } = req.params
  db.prepare('UPDATE model_versions SET status = ? WHERE id = ?').run('published', id)
  res.json({ success: true })
})

router.get('/inspection-tasks', (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, 
           p.name as product_name, p.code as product_code,
           s.name as station_name, s.code as station_code,
           c.name as camera_name, c.code as camera_code,
           mv.name as model_name, mv.version as model_version, mv.status as model_status
    FROM inspection_tasks t
    LEFT JOIN products p ON t.product_id = p.id
    LEFT JOIN stations s ON t.station_id = s.id
    LEFT JOIN cameras c ON t.camera_id = c.id
    LEFT JOIN model_versions mv ON t.model_version_id = mv.id
    ORDER BY t.created_at DESC
  `).all()
  res.json(tasks)
})

router.get('/inspection-tasks/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, 
           p.name as product_name, p.code as product_code,
           s.name as station_name, s.code as station_code,
           c.name as camera_name, c.code as camera_code,
           mv.name as model_name, mv.version as model_version
    FROM inspection_tasks t
    LEFT JOIN products p ON t.product_id = p.id
    LEFT JOIN stations s ON t.station_id = s.id
    LEFT JOIN cameras c ON t.camera_id = c.id
    LEFT JOIN model_versions mv ON t.model_version_id = mv.id
    WHERE t.id = ?
  `).get(req.params.id)
  
  if (task) {
    const items = db.prepare('SELECT * FROM inspection_items WHERE task_id = ?').all(req.params.id)
    task.items = items
  }
  res.json(task || null)
})

router.post('/inspection-tasks', (req, res) => {
  const { code, name, product_id, station_id, camera_id, model_version_id, items } = req.body
  
  const model = db.prepare('SELECT status FROM model_versions WHERE id = ?').get(model_version_id)
  if (!model || model.status !== 'published') {
    return res.status(400).json({ error: '只能使用已发布的模型版本' })
  }

  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO inspection_tasks (code, name, product_id, station_id, camera_id, model_version_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'disabled')
    `).run(code, name, product_id, station_id, camera_id, model_version_id)
    
    const taskId = result.lastInsertRowid
    const insertItem = db.prepare('INSERT INTO inspection_items (task_id, name, defect_type, threshold) VALUES (?, ?, ?, ?)')
    
    if (items && items.length > 0) {
      for (const item of items) {
        insertItem.run(taskId, item.name, item.defect_type, item.threshold)
      }
    }
    
    return taskId
  })

  try {
    const taskId = tx()
    res.json({ id: taskId, code, name })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/inspection-tasks/:id/status', (req, res) => {
  const { status } = req.body
  db.prepare('UPDATE inspection_tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id)
  res.json({ success: true })
})

router.delete('/inspection-tasks/:id', (req, res) => {
  db.prepare('DELETE FROM inspection_tasks WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

router.get('/inspection-items/:taskId', (req, res) => {
  const items = db.prepare('SELECT * FROM inspection_items WHERE task_id = ?').all(req.params.taskId)
  res.json(items)
})

router.post('/inspection-items', (req, res) => {
  const { task_id, name, defect_type, threshold } = req.body
  try {
    const result = db.prepare('INSERT INTO inspection_items (task_id, name, defect_type, threshold) VALUES (?, ?, ?, ?)').run(task_id, name, defect_type, threshold)
    res.json({ id: result.lastInsertRowid, task_id, name, defect_type, threshold })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/inspection-items/:id', (req, res) => {
  const { name, defect_type, threshold, enabled } = req.body
  db.prepare(`
    UPDATE inspection_items 
    SET name = ?, defect_type = ?, threshold = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(name, defect_type, threshold, enabled, req.params.id)
  res.json({ success: true })
})

router.delete('/inspection-items/:id', (req, res) => {
  db.prepare('DELETE FROM inspection_items WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

router.get('/defect-records', (req, res) => {
  const { batch_no, defect_type, page = 1, pageSize = 20 } = req.query
  let sql = `
    SELECT d.*, 
           t.name as task_name, t.code as task_code,
           mv.name as model_name, mv.version as model_version,
           p.name as product_name
    FROM defect_records d
    LEFT JOIN inspection_tasks t ON d.task_id = t.id
    LEFT JOIN model_versions mv ON d.model_version_id = mv.id
    LEFT JOIN products p ON t.product_id = p.id
    WHERE 1=1
  `
  const params = []
  
  if (batch_no) {
    sql += ' AND d.batch_no LIKE ?'
    params.push(`%${batch_no}%`)
  }
  if (defect_type) {
    sql += ' AND d.defect_type = ?'
    params.push(defect_type)
  }
  
  sql += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize))
  
  const records = db.prepare(sql).all(...params)
  
  let countSql = 'SELECT COUNT(*) as total FROM defect_records WHERE 1=1'
  const countParams = []
  if (batch_no) { countSql += ' AND batch_no LIKE ?'; countParams.push(`%${batch_no}%`) }
  if (defect_type) { countSql += ' AND defect_type = ?'; countParams.push(defect_type) }
  const { total } = db.prepare(countSql).get(...countParams)
  
  res.json({ records, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.get('/defect-records/:id', (req, res) => {
  const record = db.prepare(`
    SELECT d.*, 
           t.name as task_name,
           mv.name as model_name, mv.version as model_version
    FROM defect_records d
    LEFT JOIN inspection_tasks t ON d.task_id = t.id
    LEFT JOIN model_versions mv ON d.model_version_id = mv.id
    WHERE d.id = ?
  `).get(req.params.id)
  res.json(record || null)
})

router.post('/defect-records', (req, res) => {
  const { task_id, image_path, defect_type, confidence, position_x, position_y, position_w, position_h, batch_no, work_order, model_version_id } = req.body
  try {
    const result = db.prepare(`
      INSERT INTO defect_records (task_id, image_path, defect_type, confidence, position_x, position_y, position_w, position_h, batch_no, work_order, model_version_id, result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(task_id, image_path, defect_type, confidence, position_x, position_y, position_w, position_h, batch_no, work_order, model_version_id)
    res.json({ id: result.lastInsertRowid })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/defect-records/:id/rejudge', (req, res) => {
  const { rejudge_result, rejudged_by } = req.body
  db.prepare(`
    UPDATE defect_records 
    SET rejudge_result = ?, rejudged_by = ?, rejudged_at = CURRENT_TIMESTAMP, result = ?
    WHERE id = ?
  `).run(rejudge_result, rejudged_by, rejudge_result, req.params.id)
  res.json({ success: true })
})

router.get('/device-events', (req, res) => {
  const { camera_id, event_type, acknowledged } = req.query
  let sql = `
    SELECT e.*, c.name as camera_name, c.code as camera_code
    FROM device_events e
    LEFT JOIN cameras c ON e.camera_id = c.id
    WHERE 1=1
  `
  const params = []
  
  if (camera_id) { sql += ' AND e.camera_id = ?'; params.push(camera_id) }
  if (event_type) { sql += ' AND e.event_type = ?'; params.push(event_type) }
  if (acknowledged !== undefined) { sql += ' AND e.acknowledged = ?'; params.push(acknowledged) }
  
  sql += ' ORDER BY e.created_at DESC'
  const events = db.prepare(sql).all(...params)
  res.json(events)
})

router.post('/device-events', (req, res) => {
  const { camera_id, event_type, level, message } = req.body
  const result = db.prepare(`
    INSERT INTO device_events (camera_id, event_type, level, message)
    VALUES (?, ?, ?, ?)
  `).run(camera_id, event_type, level, message)
  
  if (level === 'critical' || level === 'error') {
    db.prepare(`
      INSERT INTO maintenance_tasks (device_event_id, title, description, priority)
      VALUES (?, ?, ?, ?)
    `).run(result.lastInsertRowid, `设备异常: ${event_type}`, message, level === 'critical' ? 'high' : 'medium')
  }
  
  res.json({ id: result.lastInsertRowid })
})

router.put('/device-events/:id/acknowledge', (req, res) => {
  const { acknowledged_by } = req.body
  db.prepare(`
    UPDATE device_events 
    SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(acknowledged_by, req.params.id)
  res.json({ success: true })
})

router.get('/maintenance-tasks', (req, res) => {
  const { status, assignee } = req.query
  let sql = `
    SELECT m.*, e.event_type, e.level, c.name as camera_name
    FROM maintenance_tasks m
    LEFT JOIN device_events e ON m.device_event_id = e.id
    LEFT JOIN cameras c ON e.camera_id = c.id
    WHERE 1=1
  `
  const params = []
  
  if (status) { sql += ' AND m.status = ?'; params.push(status) }
  if (assignee) { sql += ' AND m.assignee = ?'; params.push(assignee) }
  
  sql += ' ORDER BY m.created_at DESC'
  const tasks = db.prepare(sql).all(...params)
  res.json(tasks)
})

router.put('/maintenance-tasks/:id', (req, res) => {
  const { status, assignee } = req.body
  db.prepare(`
    UPDATE maintenance_tasks 
    SET status = ?, assignee = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, assignee, req.params.id)
  res.json({ success: true })
})

router.get('/statistics/overview', (req, res) => {
  const { start_date, end_date } = req.query
  
  const dateFilter = start_date && end_date 
    ? `AND created_at BETWEEN '${start_date}' AND '${end_date} 23:59:59'`
    : ''
  
  const defectStats = db.prepare(`
    SELECT 
      COUNT(*) as total_defects,
      SUM(CASE WHEN result = 'defect' THEN 1 ELSE 0 END) as confirmed_defects,
      SUM(CASE WHEN result = 'false_positive' THEN 1 ELSE 0 END) as false_positives,
      SUM(CASE WHEN result = 'pending' THEN 1 ELSE 0 END) as pending
    FROM defect_records 
    WHERE 1=1 ${dateFilter}
  `).get()
  
  const defectByType = db.prepare(`
    SELECT defect_type, COUNT(*) as count
    FROM defect_records
    WHERE 1=1 ${dateFilter}
    GROUP BY defect_type
    ORDER BY count DESC
  `).all()
  
  const defectByBatch = db.prepare(`
    SELECT batch_no, COUNT(*) as count
    FROM defect_records
    WHERE batch_no IS NOT NULL ${dateFilter}
    GROUP BY batch_no
    ORDER BY count DESC
    LIMIT 10
  `).all()
  
  const taskStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM inspection_tasks
    GROUP BY status
  `).all()
  
  const deviceStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM cameras
    GROUP BY status
  `).all()
  
  res.json({
    defectStats,
    defectByType,
    defectByBatch,
    taskStats,
    deviceStats
  })
})

router.get('/statistics/quality-trend', (req, res) => {
  const { days = 7 } = req.query
  
  const data = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      SUM(CASE WHEN result = 'defect' THEN 1 ELSE 0 END) as defects,
      SUM(CASE WHEN result = 'false_positive' THEN 1 ELSE 0 END) as false_positives
    FROM defect_records
    WHERE created_at >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(days)
  
  res.json(data)
})

module.exports = router
