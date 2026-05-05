const express = require('express');
const db = require('../database');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/report', (req, res) => {
  const {
    vehicle_id, order_id, lat, lng, address, speed, direction, altitude,
    door_status, light_status, cargo_door_status, current_load
  } = req.body;

  if (!vehicle_id || lat === undefined || lng === undefined) {
    return res.status(400).json({ message: '车辆ID和坐标不能为空' });
  }

  try {
    db.prepare(`
      INSERT INTO gps_tracks (
        vehicle_id, order_id, lat, lng, address, speed, direction, altitude,
        door_status, light_status, cargo_door_status, current_load, report_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(vehicle_id, order_id, lat, lng, address, speed, direction, altitude,
            door_status, light_status, cargo_door_status, current_load);

    db.prepare(`
      UPDATE vehicles SET 
        current_lat = ?, current_lng = ?, current_address = ?, 
        speed = ?, direction = ?, door_status = ?, light_status = ?,
        cargo_door_status = ?, current_load = ?, last_report_time = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(lat, lng, address, speed, direction, door_status, light_status,
            cargo_door_status, current_load, vehicle_id);

    res.json({ message: 'GPS上报成功' });
  } catch (error) {
    res.status(500).json({ message: '上报失败', error: error.message });
  }
});

router.get('/vehicles/realtime', checkPermission('vehicle', 'dispatch', 'all'), (req, res) => {
  const vehicles = db.prepare(`
    SELECT v.*, d.real_name as driver_name, d.phone as driver_phone,
           o.order_no, o.customer_name, o.dest_address
    FROM vehicles v
    LEFT JOIN drivers d ON v.driver_id = d.id
    LEFT JOIN orders o ON v.id = o.vehicle_id AND o.status IN ('transit', 'loading', 'unloading')
    WHERE v.last_report_time IS NOT NULL
    ORDER BY v.last_report_time DESC
  `).all();

  res.json(vehicles);
});

router.get('/vehicle/:vehicleId/track', checkPermission('vehicle', 'order', 'all'), (req, res) => {
  const { vehicleId } = req.params;
  const { order_id, start_time, end_time, limit = 100 } = req.query;

  let whereClause = 'vehicle_id = ?';
  const params = [vehicleId];

  if (order_id) {
    whereClause += ' AND order_id = ?';
    params.push(order_id);
  }
  if (start_time) {
    whereClause += ' AND report_time >= ?';
    params.push(start_time);
  }
  if (end_time) {
    whereClause += ' AND report_time <= ?';
    params.push(end_time);
  }

  const tracks = db.prepare(`
    SELECT * FROM gps_tracks 
    WHERE ${whereClause}
    ORDER BY report_time DESC
    LIMIT ?
  `).all(...params, parseInt(limit));

  res.json(tracks.reverse());
});

router.get('/order/:orderId/track', checkPermission('order', 'all'), (req, res) => {
  const { orderId } = req.params;

  const tracks = db.prepare(`
    SELECT gt.*, v.plate_number
    FROM gps_tracks gt
    LEFT JOIN vehicles v ON gt.vehicle_id = v.id
    WHERE gt.order_id = ?
    ORDER BY gt.report_time ASC
  `).all(orderId);

  const order = db.prepare(`
    SELECT o.*, v.plate_number, d.real_name as driver_name
    FROM orders o
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    WHERE o.id = ?
  `).get(orderId);

  res.json({
    order,
    tracks
  });
});

router.get('/tracks', checkPermission('vehicle', 'order', 'all'), (req, res) => {
  const { order_no, vehicle_id, start_date, end_date, page = 1, pageSize = 100 } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = '1=1';
  const params = [];

  if (order_no) {
    const order = db.prepare('SELECT id FROM orders WHERE order_no = ?').get(order_no);
    if (order) {
      whereClause += ' AND gt.order_id = ?';
      params.push(order.id);
    } else {
      return res.json({ data: [], pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: 0 } });
    }
  }
  if (vehicle_id) {
    whereClause += ' AND gt.vehicle_id = ?';
    params.push(vehicle_id);
  }
  if (start_date) {
    whereClause += ' AND date(gt.report_time) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    whereClause += ' AND date(gt.report_time) <= ?';
    params.push(end_date);
  }

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM gps_tracks gt WHERE ${whereClause}
  `);
  const { total } = countStmt.get(...params);

  const tracks = db.prepare(`
    SELECT gt.*, v.plate_number, o.order_no
    FROM gps_tracks gt
    LEFT JOIN vehicles v ON gt.vehicle_id = v.id
    LEFT JOIN orders o ON gt.order_id = o.id
    WHERE ${whereClause}
    ORDER BY gt.report_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: tracks,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/order/:orderId/status', checkPermission('order', 'view_order', 'track_cargo', 'all'), (req, res) => {
  const { orderId } = req.params;

  const order = db.prepare(`
    SELECT o.*, v.plate_number, v.current_lat, v.current_lng, v.current_address,
           v.speed, v.direction, v.last_report_time,
           d.real_name as driver_name, d.phone as driver_phone
    FROM orders o
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }

  const lastTrack = db.prepare(`
    SELECT * FROM gps_tracks 
    WHERE order_id = ? 
    ORDER BY report_time DESC 
    LIMIT 1
  `).get(orderId);

  const statusDict = db.prepare(`
    SELECT dict_value FROM data_dictionary 
    WHERE dict_type = 'order_status' AND dict_key = ?
  `).get(order.status);

  res.json({
    order_no: order.order_no,
    status: order.status,
    status_text: statusDict ? statusDict.dict_value : order.status,
    customer_name: order.customer_name,
    origin_address: order.origin_address,
    dest_address: order.dest_address,
    vehicle_plate: order.plate_number,
    driver_name: order.driver_name,
    driver_phone: order.driver_phone,
    current_lat: order.current_lat,
    current_lng: order.current_lng,
    current_address: order.current_address,
    speed: order.speed,
    direction: order.direction,
    last_report_time: order.last_report_time || (lastTrack ? lastTrack.report_time : null),
    estimated_arrival_time: order.estimated_arrival_time,
    actual_departure_time: order.actual_departure_time,
    plan_arrival_time: order.plan_arrival_time,
    last_track: lastTrack
  });
});

module.exports = router;
