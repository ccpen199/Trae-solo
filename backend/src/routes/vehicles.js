const express = require('express');
const db = require('../database');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkPermission('vehicle', 'all'), (req, res) => {
  const { status, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '1=1';
  const params = [];

  if (status) {
    whereClause += ' AND v.status = ?';
    params.push(status);
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM vehicles v WHERE ${whereClause}`);
  const { total } = countStmt.get(...params);

  const vehicles = db.prepare(`
    SELECT v.*, d.real_name as driver_name, d.phone as driver_phone
    FROM vehicles v
    LEFT JOIN drivers d ON v.driver_id = d.id
    WHERE ${whereClause}
    ORDER BY v.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: vehicles,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/:id', checkPermission('vehicle', 'all'), (req, res) => {
  const vehicle = db.prepare(`
    SELECT v.*, d.real_name as driver_name, d.phone as driver_phone
    FROM vehicles v
    LEFT JOIN drivers d ON v.driver_id = d.id
    WHERE v.id = ?
  `).get(req.params.id);

  if (!vehicle) {
    return res.status(404).json({ message: '车辆不存在' });
  }

  res.json(vehicle);
});

router.post('/', checkPermission('vehicle', 'all'), (req, res) => {
  const {
    plate_number, vehicle_type, vehicle_model, capacity, load_limit,
    fuel_type, gps_device_id, driver_id
  } = req.body;

  if (!plate_number) {
    return res.status(400).json({ message: '车牌号不能为空' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO vehicles (plate_number, vehicle_type, vehicle_model, capacity, load_limit, fuel_type, gps_device_id, driver_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(plate_number, vehicle_type, vehicle_model, capacity, load_limit, fuel_type, gps_device_id, driver_id);

    res.json({ message: '车辆添加成功', id: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: '车牌号已存在' });
    }
    res.status(500).json({ message: '添加失败', error: error.message });
  }
});

router.put('/:id', checkPermission('vehicle', 'all'), (req, res) => {
  const {
    plate_number, vehicle_type, vehicle_model, capacity, load_limit,
    fuel_type, status, gps_device_id, driver_id
  } = req.body;

  try {
    const oldVehicle = db.prepare('SELECT status FROM vehicles WHERE id = ?').get(req.params.id);
    
    if (!oldVehicle) {
      return res.status(404).json({ message: '车辆不存在' });
    }

    const result = db.prepare(`
      UPDATE vehicles SET 
        plate_number = ?, vehicle_type = ?, vehicle_model = ?, capacity = ?, 
        load_limit = ?, fuel_type = ?, status = ?, gps_device_id = ?, 
        driver_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(plate_number, vehicle_type, vehicle_model, capacity, load_limit, fuel_type, status, gps_device_id, driver_id, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ message: '车辆不存在' });
    }

    if (oldVehicle.status !== status) {
      db.prepare(`
        INSERT INTO vehicle_status_logs (vehicle_id, old_status, new_status, operator_id)
        VALUES (?, ?, ?, ?)
      `).run(req.params.id, oldVehicle.status, status, req.user.id);
    }

    res.json({ message: '车辆更新成功' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: '车牌号已存在' });
    }
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.delete('/:id', checkPermission('vehicle', 'all'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: '车辆不存在' });
    }

    res.json({ message: '车辆删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

router.get('/idle/list', checkPermission('vehicle', 'dispatch', 'all'), (req, res) => {
  const vehicles = db.prepare(`
    SELECT v.*, d.real_name as driver_name, d.phone as driver_phone
    FROM vehicles v
    LEFT JOIN drivers d ON v.driver_id = d.id
    WHERE v.status = 'idle'
    ORDER BY v.created_at DESC
  `).all();

  res.json(vehicles);
});

module.exports = router;
