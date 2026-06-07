import { Router, Request, Response } from 'express';
import db from '../db/init';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10', district, building_type, price_min, price_max, school_district, subway, search } = req.query;
    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const offset = (pageNum - 1) * sizeNum;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (district) { where += ' AND district = ?'; params.push(district); }
    if (building_type) { where += ' AND building_type = ?'; params.push(building_type); }
    if (price_min) { where += ' AND avg_price >= ?'; params.push(Number(price_min)); }
    if (price_max) { where += ' AND avg_price <= ?'; params.push(Number(price_max)); }
    if (school_district) { where += ' AND school_district LIKE ?'; params.push(`%${school_district}%`); }
    if (subway) { where += ' AND subway_lines LIKE ?'; params.push(`%${subway}%`); }
    if (search) { where += ' AND (name LIKE ? OR address LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM buildings ${where}`).get(...params) as any).cnt;
    const rows = db.prepare(`SELECT * FROM buildings ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, sizeNum, offset);

    res.json({ code: 0, data: { list: rows, total, page: pageNum, pageSize: sizeNum }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id) as any;
    if (!building) { res.json({ code: -1, message: '楼盘不存在' }); return; }

    const listingStats = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(AVG(CASE WHEN type != '租赁' THEN unit_price END), 0) as avg_listing_price
      FROM listings WHERE building_id = ? AND status = '在售'
    `).get(req.params.id) as any;

    res.json({ code: 0, data: { ...building, listings_count: listingStats.count, avg_listing_price: Math.round(listingStats.avg_listing_price) }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const b = req.body;
    const result = db.prepare(`
      INSERT INTO buildings (name, address, lat, lng, developer, developer_qualification, floor_area_ratio, greening_rate, building_type, total_units, completion_year, district, subway_lines, school_district, avg_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(b.name, b.address, b.lat, b.lng, b.developer, b.developer_qualification, b.floor_area_ratio, b.greening_rate, b.building_type, b.total_units, b.completion_year, b.district, b.subway_lines ? JSON.stringify(b.subway_lines) : null, b.school_district, b.avg_price);

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE buildings SET name=COALESCE(?,name), address=COALESCE(?,address), lat=COALESCE(?,lat), lng=COALESCE(?,lng),
        developer=COALESCE(?,developer), developer_qualification=COALESCE(?,developer_qualification),
        floor_area_ratio=COALESCE(?,floor_area_ratio), greening_rate=COALESCE(?,greening_rate),
        building_type=COALESCE(?,building_type), total_units=COALESCE(?,total_units),
        completion_year=COALESCE(?,completion_year), district=COALESCE(?,district),
        subway_lines=COALESCE(?,subway_lines), school_district=COALESCE(?,school_district),
        avg_price=COALESCE(?,avg_price), updated_at=datetime('now','localtime')
      WHERE id = ?
    `).run(b.name, b.address, b.lat, b.lng, b.developer, b.developer_qualification, b.floor_area_ratio, b.greening_rate, b.building_type, b.total_units, b.completion_year, b.district, b.subway_lines ? JSON.stringify(b.subway_lines) : undefined, b.school_district, b.avg_price, req.params.id);

    res.json({ code: 0, data: { id: req.params.id }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

export default router;
