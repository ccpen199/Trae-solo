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

  if (status !== undefined) {
    whereClause += ' AND d.status = ?';
    params.push(parseInt(status));
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM drivers d WHERE ${whereClause}`);
  const { total } = countStmt.get(...params);

  const drivers = db.prepare(`
    SELECT d.*, v.plate_number as vehicle_plate, u.username
    FROM drivers d
    LEFT JOIN vehicles v ON d.vehicle_id = v.id
    LEFT JOIN users u ON d.user_id = u.id
    WHERE ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: drivers,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/:id', checkPermission('vehicle', 'all'), (req, res) => {
  const driver = db.prepare(`
    SELECT d.*, v.plate_number as vehicle_plate, u.username
    FROM drivers d
    LEFT JOIN vehicles v ON d.vehicle_id = v.id
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!driver) {
    return res.status(404).json({ message: '司机不存在' });
  }

  res.json(driver);
});

router.post('/', checkPermission('vehicle', 'all'), (req, res) => {
  const {
    real_name, phone, id_card, driver_license, license_type, user_id, vehicle_id
  } = req.body;

  if (!real_name || !phone) {
    return res.status(400).json({ message: '姓名和电话不能为空' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO drivers (real_name, phone, id_card, driver_license, license_type, user_id, vehicle_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(real_name, phone, id_card, driver_license, license_type, user_id, vehicle_id);

    res.json({ message: '司机添加成功', id: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: '身份证号已存在' });
    }
    res.status(500).json({ message: '添加失败', error: error.message });
  }
});

router.put('/:id', checkPermission('vehicle', 'all'), (req, res) => {
  const {
    real_name, phone, id_card, driver_license, license_type, status, user_id, vehicle_id
  } = req.body;

  try {
    const result = db.prepare(`
      UPDATE drivers SET 
        real_name = ?, phone = ?, id_card = ?, driver_license = ?, 
        license_type = ?, status = ?, user_id = ?, vehicle_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(real_name, phone, id_card, driver_license, license_type, status, user_id, vehicle_id, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ message: '司机不存在' });
    }

    res.json({ message: '司机更新成功' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: '身份证号已存在' });
    }
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.delete('/:id', checkPermission('vehicle', 'all'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: '司机不存在' });
    }

    res.json({ message: '司机删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

router.get('/idle/list', checkPermission('vehicle', 'dispatch', 'all'), (req, res) => {
  const drivers = db.prepare(`
    SELECT d.*, v.plate_number as vehicle_plate
    FROM drivers d
    LEFT JOIN vehicles v ON d.vehicle_id = v.id
    WHERE d.status = 1 AND d.current_order_id IS NULL
    ORDER BY d.created_at DESC
  `).all();

  res.json(drivers);
});

module.exports = router;
