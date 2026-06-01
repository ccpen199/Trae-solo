import { Router, Request, Response } from 'express';
import db from '../db';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { lat, lng, radius = 5, status } = req.query;
  
  let sql = `
    SELECT s.*, 
      (SELECT COUNT(*) FROM guns g WHERE g.station_id = s.id AND g.status = 'idle') as available_guns,
      (SELECT COUNT(*) FROM guns g WHERE g.station_id = s.id) as total_guns,
      u.nickname as operator_name
    FROM stations s
    LEFT JOIN users u ON s.operator_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (lat && lng) {
    sql += ` AND (
      6371 * acos(
        cos(radians(?)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(s.latitude))
      )
    ) <= ?`;
    params.push(parseFloat(lat as string), parseFloat(lng as string), parseFloat(lat as string), parseFloat(radius as string));
  }

  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY s.id DESC';

  const stations = db.prepare(sql).all(...params);
  res.json({ stations });
});

router.get('/:id', (req: Request, res: Response) => {
  const station = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM guns g WHERE g.station_id = s.id AND g.status = 'idle') as available_guns,
      (SELECT COUNT(*) FROM guns g WHERE g.station_id = s.id) as total_guns,
      u.nickname as operator_name
    FROM stations s
    LEFT JOIN users u ON s.operator_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!station) {
    return res.status(404).json({ error: '站点不存在' });
  }

  const guns = db.prepare(`
    SELECT g.*, c.serial_number as charger_sn, c.model as charger_model, c.power as charger_power
    FROM guns g
    JOIN chargers c ON g.charger_id = c.id
    WHERE g.station_id = ?
    ORDER BY g.gun_no
  `).all(req.params.id);

  const chargers = db.prepare(`
    SELECT * FROM chargers WHERE station_id = ? ORDER BY serial_number
  `).all(req.params.id);

  res.json({ station, guns, chargers });
});

router.get('/:id/guns', (req: Request, res: Response) => {
  const guns = db.prepare(`
    SELECT g.*, c.serial_number as charger_sn, c.model as charger_model, c.power as charger_power,
      (SELECT r.status FROM reservations r 
       WHERE r.gun_id = g.id AND r.status IN ('pending', 'active') 
       ORDER BY r.created_at DESC LIMIT 1) as reservation_status
    FROM guns g
    JOIN chargers c ON g.charger_id = c.id
    WHERE g.station_id = ?
    ORDER BY g.gun_no
  `).all(req.params.id);

  res.json({ guns });
});

router.post('/', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { name, address, longitude, latitude, price_per_kwh, parking_fee, business_hours } = req.body;

  if (!name || !address || !longitude || !latitude) {
    return res.status(400).json({ error: '名称、地址、经纬度不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO stations (name, address, longitude, latitude, operator_id, price_per_kwh, parking_fee, business_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, address, parseFloat(longitude), parseFloat(latitude),
    req.user!.role === 'operator' ? req.user!.id : null,
    parseFloat(price_per_kwh) || 1.5,
    parseFloat(parking_fee) || 0,
    business_hours || '00:00-24:00'
  );

  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ station });
});

router.put('/:id', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { name, address, longitude, latitude, price_per_kwh, parking_fee, business_hours, status } = req.body;

  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  if (!station) {
    return res.status(404).json({ error: '站点不存在' });
  }

  if (req.user!.role === 'operator' && station.operator_id !== req.user!.id) {
    return res.status(403).json({ error: '无权限修改此站点' });
  }

  db.prepare(`
    UPDATE stations SET 
      name = COALESCE(?, name),
      address = COALESCE(?, address),
      longitude = COALESCE(?, longitude),
      latitude = COALESCE(?, latitude),
      price_per_kwh = COALESCE(?, price_per_kwh),
      parking_fee = COALESCE(?, parking_fee),
      business_hours = COALESCE(?, business_hours),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, address, longitude, latitude, price_per_kwh, parking_fee, business_hours, status, req.params.id);

  const updated = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
  res.json({ station: updated });
});

export default router;
