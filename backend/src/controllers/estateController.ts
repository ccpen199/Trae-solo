import { Request, Response } from 'express';
import { getDatabase } from '../models/database.js';
import { calculateDistance, isInRadius } from '../utils/geoUtils.js';

export const getEstates = (req: Request, res: Response): void => {
  const db = getDatabase();
  const {
    type,
    district,
    minPrice,
    maxPrice,
    bedrooms,
    lat,
    lng,
    radius,
    metroLine,
    schoolDistrict,
    page = 1,
    pageSize = 20,
  } = req.query;

  let sql = `
    SELECT e.*, 
           COUNT(p.id) as property_count,
           MIN(p.price) as min_price,
           MAX(p.price) as max_price
    FROM estates e
    LEFT JOIN properties p ON e.id = p.estate_id AND p.status = 'active'
    WHERE e.status = 'active'
  `;
  const params: any[] = [];

  if (type) {
    sql += ' AND e.type = ?';
    params.push(type);
  }
  if (district) {
    sql += ' AND e.district = ?';
    params.push(district);
  }
  if (minPrice) {
    sql += ' AND e.average_price >= ?';
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    sql += ' AND e.average_price <= ?';
    params.push(Number(maxPrice));
  }
  if (metroLine) {
    sql += ' AND e.metro_lines LIKE ?';
    params.push(`%${metroLine}%`);
  }
  if (schoolDistrict) {
    sql += ' AND e.school_district LIKE ?';
    params.push(`%${schoolDistrict}%`);
  }

  sql += ' GROUP BY e.id';
  const baseSql = sql;

  if (lat && lng && radius) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radius);
    const estates = db.prepare(sql).all(...params) as any[];
    const filtered = estates.filter((e: any) =>
      isInRadius(latNum, lngNum, e.lat, e.lng, radiusNum)
    );
    const withDistance = filtered.map((e: any) => ({
      ...e,
      distance: calculateDistance(latNum, lngNum, e.lat, e.lng),
    }));
    withDistance.sort((a, b) => a.distance - b.distance);

    const offset = (Number(page) - 1) * Number(pageSize);
    const paginated = withDistance.slice(offset, offset + Number(pageSize));

    res.json({
      success: true,
      data: paginated,
      total: withDistance.length,
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return;
  }

  sql += ' ORDER BY e.id DESC';
  sql += ' LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  let countSql = "SELECT COUNT(*) FROM estates e WHERE e.status = 'active'";
  const countParams: any[] = [];
  if (type) { countSql += ' AND e.type = ?'; countParams.push(type); }
  if (district) { countSql += ' AND e.district = ?'; countParams.push(district); }
  if (minPrice) { countSql += ' AND e.average_price >= ?'; countParams.push(Number(minPrice)); }
  if (maxPrice) { countSql += ' AND e.average_price <= ?'; countParams.push(Number(maxPrice)); }
  if (metroLine) { countSql += ' AND e.metro_lines LIKE ?'; countParams.push(`%${metroLine}%`); }
  if (schoolDistrict) { countSql += ' AND e.school_district LIKE ?'; countParams.push(`%${schoolDistrict}%`); }
  const total = (db.prepare(countSql).get(...countParams) as any)['COUNT(*)'];

  const estates = db.prepare(sql).all(...params);

  res.json({
    success: true,
    data: estates,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  });
};

export const getEstateById = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { id } = req.params;

  const estate = db.prepare('SELECT * FROM estates WHERE id = ?').get(id);

  if (!estate) {
    res.status(404).json({ success: false, message: '楼盘不存在' });
    return;
  }

  const properties = db.prepare(`
    SELECT p.*, b.name as broker_name, b.avatar as broker_avatar, b.rating as broker_rating
    FROM properties p
    LEFT JOIN brokers b ON p.broker_id = b.id
    WHERE p.estate_id = ? AND p.status = 'active'
    ORDER BY p.id DESC
    LIMIT 50
  `).all(id);

  const priceHistory = db.prepare(`
    SELECT AVG(price) as avg_price, date
    FROM price_history ph
    JOIN properties p ON ph.property_id = p.id
    WHERE p.estate_id = ?
    GROUP BY date
    ORDER BY date
  `).all(id);

  res.json({
    success: true,
    data: {
      ...estate,
      properties,
      priceHistory,
    },
  });
};

export const createEstate = (req: Request, res: Response): void => {
  const db = getDatabase();
  const {
    name, type, address, district, lat, lng, developer,
    property_company, property_fee, build_year, total_households,
    parking_count, green_rate, volume_rate, average_price, description,
    metro_lines, school_district, facilities,
  } = req.body;

  const result = db.prepare(`
    INSERT INTO estates (name, type, address, district, lat, lng, developer, property_company,
      property_fee, build_year, total_households, parking_count, green_rate, volume_rate,
      average_price, description, metro_lines, school_district, facilities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, type, address, district, lat, lng, developer, property_company,
    property_fee, build_year, total_households, parking_count, green_rate, volume_rate,
    average_price, description, metro_lines, school_district, facilities
  );

  res.json({
    success: true,
    data: { id: result.lastInsertRowid },
    message: '楼盘创建成功',
  });
};

export const updateEstate = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { id } = req.params;
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);

  if (fields.length === 0) {
    res.status(400).json({ success: false, message: '没有更新字段' });
    return;
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const sql = `UPDATE estates SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  db.prepare(sql).run(...values, id);

  res.json({ success: true, message: '楼盘更新成功' });
};
