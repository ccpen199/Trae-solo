import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (req, res) => {
  const { 
    type, 
    category, 
    district, 
    minPrice, 
    maxPrice, 
    minArea, 
    maxArea,
    rooms,
    keyword,
    page = 1, 
    pageSize = 20,
    sort = 'created_at',
    order = 'desc'
  } = req.query;

  let where = ["status = 'active'"];
  let params: any[] = [];

  if (type && type !== 'all') {
    where.push('type = ?');
    params.push(type);
  }
  if (category && category !== 'all') {
    where.push('category = ?');
    params.push(category);
  }
  if (district && district !== 'all') {
    where.push('district = ?');
    params.push(district);
  }
  if (minPrice) {
    where.push('price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    where.push('price <= ?');
    params.push(Number(maxPrice));
  }
  if (minArea) {
    where.push('area >= ?');
    params.push(Number(minArea));
  }
  if (maxArea) {
    where.push('area <= ?');
    params.push(Number(maxArea));
  }
  if (rooms && rooms !== 'all') {
    where.push('room_count = ?');
    params.push(Number(rooms));
  }
  if (keyword) {
    where.push('(title LIKE ? OR address LIKE ? OR community LIKE ?)');
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(pageSize);
  const sortField = ['price', 'area', 'created_at', 'view_count'].includes(String(sort)) ? sort : 'created_at';
  const orderDir = order === 'asc' ? 'ASC' : 'DESC';

  const total = db.prepare(`SELECT COUNT(*) as count FROM properties ${whereSql}`).get(...params) as { count: number };
  
  const list = db.prepare(
    `SELECT id, title, type, category, price, price_unit, area, floor, orientation, decoration, 
            building_age, address, district, community, room_count, hall_count, bathroom_count,
            features, images, is_verified, view_count, favorite_count, created_at
     FROM properties ${whereSql}
     ORDER BY ${sortField} ${orderDir}
     LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset);

  res.json({
    list,
    total: total.count,
    page: Number(page),
    pageSize: Number(pageSize)
  });
});

router.get('/:id', (req, res) => {
  const property = db.prepare(
    `SELECT p.*, 
            a.id as agent_id, a.real_name as agent_name, a.phone as agent_phone, a.agency as agent_agency, a.rating as agent_rating,
            d.id as developer_id, d.company_name as developer_name, d.credit_level as developer_credit
     FROM properties p
     LEFT JOIN agents a ON p.agent_id = a.id
     LEFT JOIN developers d ON p.developer_id = d.id
     WHERE p.id = ?`
  ).get(req.params.id);

  if (!property) {
    res.status(404).json({ message: '房源不存在' });
    return;
  }

  const detail = db.prepare('SELECT * FROM property_details WHERE property_id = ?').get(req.params.id);

  db.prepare('UPDATE properties SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

  res.json({ ...property, detail: detail || null });
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const {
    title, type, category, price, priceUnit, area, floor, totalFloor,
    orientation, decoration, buildingAge, address, district, community,
    roomCount, hallCount, bathroomCount, description, features, images
  } = req.body;

  if (!title || !type || !price || !area || !address) {
    res.status(400).json({ message: '缺少必要信息' });
    return;
  }

  let agentId = null;
  let ownerId = null;
  let developerId = null;

  if (req.user!.role === 'agent') {
    const agent = db.prepare('SELECT id FROM agents WHERE user_id = ?').get(req.user!.id) as any;
    agentId = agent?.id;
  } else if (req.user!.role === 'developer') {
    const dev = db.prepare('SELECT id FROM developers WHERE user_id = ?').get(req.user!.id) as any;
    developerId = dev?.id;
  } else {
    ownerId = req.user!.id;
  }

  const result = db.prepare(
    `INSERT INTO properties 
     (title, type, category, price, price_unit, area, floor, total_floor, orientation, decoration, 
      building_age, address, district, community, room_count, hall_count, bathroom_count, 
      description, features, images, owner_id, agent_id, developer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    title, type, category, price, priceUnit || 'wan', area, floor || '', totalFloor || 0,
    orientation || '', decoration || '', buildingAge || 0, address, district || '', community || '',
    roomCount || 0, hallCount || 0, bathroomCount || 0,
    description || '', features || '', images ? JSON.stringify(images) : '[]',
    ownerId, agentId, developerId
  );

  res.json({ id: result.lastInsertRowid, message: '发布成功' });
});

router.get('/districts/list', (req, res) => {
  const districts = db.prepare(
    "SELECT DISTINCT district FROM properties WHERE status = 'active' AND district IS NOT NULL ORDER BY district"
  ).all();
  res.json(districts.map((d: any) => d.district));
});

export default router;
