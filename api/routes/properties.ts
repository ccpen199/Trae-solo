import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'real_estate_platform_secret_key_2024';

const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: '未登录' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: '登录已过期' });
  }
};

router.get('/', (req, res) => {
  try {
    const { type, category, city, district, minPrice, maxPrice, minArea, maxArea, bedrooms, metro, school, keyword, page = 1, pageSize = 20 } = req.query;

    let sql = 'SELECT p.*, u.real_name as owner_name, a.agency_name, a.average_rating FROM properties p LEFT JOIN users u ON p.owner_id = u.id LEFT JOIN agents a ON p.agent_id = a.id WHERE p.status = ? AND p.verify_status = ?';
    const params: any[] = ['active', 'approved'];

    if (type && type !== 'all') {
      sql += ' AND p.type = ?';
      params.push(type);
    }
    if (category && category !== 'all') {
      sql += ' AND p.category = ?';
      params.push(category);
    }
    if (city) {
      sql += ' AND p.city = ?';
      params.push(city);
    }
    if (district) {
      sql += ' AND p.district = ?';
      params.push(district);
    }
    if (minPrice) {
      sql += ' AND p.price >= ?';
      params.push(parseFloat(minPrice as string));
    }
    if (maxPrice) {
      sql += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice as string));
    }
    if (minArea) {
      sql += ' AND p.area >= ?';
      params.push(parseFloat(minArea as string));
    }
    if (maxArea) {
      sql += ' AND p.area <= ?';
      params.push(parseFloat(maxArea as string));
    }
    if (bedrooms && bedrooms !== 'all') {
      const br = parseInt(bedrooms as string);
      if (br >= 5) {
        sql += ' AND p.bedrooms >= ?';
        params.push(5);
      } else {
        sql += ' AND p.bedrooms = ?';
        params.push(br);
      }
    }
    if (metro === 'true') {
      sql += ' AND p.metro_station IS NOT NULL';
    }
    if (school === 'true') {
      sql += ' AND p.school_district IS NOT NULL';
    }
    if (keyword) {
      sql += ' AND (p.title LIKE ? OR p.address LIKE ? OR p.community LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const countSql = sql.replace('SELECT p.*, u.real_name as owner_name, a.agency_name, a.average_rating', 'SELECT COUNT(*) as total');
    const totalResult = db.prepare(countSql).get(...params) as { total: number };

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize as string), offset);

    const properties = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: {
        list: properties,
        total: totalResult.total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string)
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ success: false, error: '获取房源列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const property = db.prepare(`
      SELECT p.*, u.real_name as owner_name, u.phone as owner_phone,
             a.id as agent_id, a.agency_name, a.average_rating, a.total_deals, a.conversion_rate,
             au.real_name as agent_name, au.phone as agent_phone
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN agents a ON p.agent_id = a.id
      LEFT JOIN users au ON a.user_id = au.id
      WHERE p.id = ?
    `).get(req.params.id) as any;

    if (!property) {
      return res.status(404).json({ success: false, error: '房源不存在' });
    }

    db.prepare('UPDATE properties SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

    const priceStats = db.prepare(`
      SELECT * FROM community_price_stats WHERE community = ? ORDER BY stat_date DESC LIMIT 1
    `).get(property.community);

    const priceRecords = db.prepare(`
      SELECT * FROM price_records WHERE property_id = ?
      ORDER BY record_date DESC LIMIT 12
    `).all(req.params.id);

    const verifications = db.prepare(`
      SELECT * FROM property_verifications WHERE property_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({
      success: true,
      data: {
        property,
        priceStats,
        price_records: priceRecords,
        property_verifications: verifications
      }
    });
  } catch (error) {
    console.error('Get property detail error:', error);
    res.status(500).json({ success: false, error: '获取房源详情失败' });
  }
});

router.post('/', authenticate, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const data = req.body;

    const stmt = db.prepare(`
      INSERT INTO properties (title, type, category, price, area, bedrooms, bathrooms, floor,
        total_floors, orientation, decoration, building_type, building_age, address, city, district,
        community, latitude, longitude, metro_station, metro_distance, school_district, school_rating,
        description, features, images, owner_id, agent_id, publish_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.title, data.type, data.category, data.price, data.area,
      data.bedrooms || null, data.bathrooms || null, data.floor || '',
      data.total_floors || null, data.orientation || '', data.decoration || '',
      data.building_type || '', data.building_age || null, data.address, data.city,
      data.district || '', data.community || '', data.latitude || null, data.longitude || null,
      data.metro_station || '', data.metro_distance || null, data.school_district || '',
      data.school_rating || null, data.description || '', data.features || '',
      data.images || '', userId, data.agent_id || null, data.publish_type || 'owner'
    );

    const propertyId = result.lastInsertRowid;

    res.json({
      success: true,
      data: { id: propertyId }
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ success: false, error: '发布房源失败' });
  }
});

router.get('/map/search', (req, res) => {
  try {
    const { lat, lng, radius = 1000, type, city } = req.query;

    let sql = `
      SELECT p.*,
             6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))) AS distance
      FROM properties p
      WHERE p.status = 'active' AND p.verify_status = 'approved'
    `;
    const params: any[] = [lat, lng, lat];

    if (city) {
      sql += ' AND p.city = ?';
      params.push(city);
    }
    if (type && type !== 'all') {
      sql += ' AND p.type = ?';
      params.push(type);
    }

    sql += ' HAVING distance <= ? ORDER BY distance LIMIT 100';
    params.push(parseFloat(radius as string) / 1000);

    const properties = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Map search error:', error);
    res.status(500).json({ success: false, error: '地图搜索失败' });
  }
});

router.post('/:id/inquiry', authenticate, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const propertyId = req.params.id;
    const { message, phone } = req.body;

    const property = db.prepare('SELECT agent_id FROM properties WHERE id = ?').get(propertyId) as any;
    if (!property) {
      return res.status(404).json({ success: false, error: '房源不存在' });
    }

    const stmt = db.prepare(`
      INSERT INTO inquiries (user_id, property_id, agent_id, message, phone)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(userId, propertyId, property.agent_id || null, message || '', phone || '');

    res.json({ success: true, data: { message: '咨询已提交' } });
  } catch (error) {
    console.error('Inquiry error:', error);
    res.status(500).json({ success: false, error: '提交咨询失败' });
  }
});

router.post('/:id/favorite', authenticate, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const propertyId = req.params.id;

    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND property_id = ?').get(userId, propertyId);

    if (existing) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND property_id = ?').run(userId, propertyId);
      res.json({ success: true, data: { isFavorite: false } });
    } else {
      db.prepare('INSERT INTO favorites (user_id, property_id) VALUES (?, ?)').run(userId, propertyId);
      res.json({ success: true, data: { isFavorite: true } });
    }
  } catch (error) {
    console.error('Favorite error:', error);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

router.post('/:id/appeal', authenticate, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const propertyId = req.params.id;
    const { reason, evidence } = req.body;

    const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(propertyId) as any;
    if (!property) {
      return res.status(404).json({ success: false, error: '房源不存在' });
    }

    const stmt = db.prepare(`
      INSERT INTO appeals (property_id, user_id, reason, evidence)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(propertyId, userId, reason, evidence || '');

    res.json({ success: true, data: { message: '申诉已提交' } });
  } catch (error) {
    console.error('Appeal error:', error);
    res.status(500).json({ success: false, error: '提交申诉失败' });
  }
});

router.get('/:id/verification', (req, res) => {
  try {
    const propertyId = req.params.id;

    const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(propertyId) as any;
    if (!property) {
      return res.status(404).json({ success: false, error: '房源不存在' });
    }

    const verification = db.prepare(`
      SELECT * FROM property_verifications WHERE property_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).get(propertyId) as any;

    const ocrResult = verification?.certificate_ocr_result ? JSON.parse(verification.certificate_ocr_result as string) : null;

    res.json({
      success: true,
      data: {
        ocr: ocrResult,
        fake_detection: {
          is_fake: (property as any).is_fake === 1,
          image_duplicate: verification?.image_duplicate_check === 1,
          duplicate_count: verification?.duplicate_images ? (JSON.parse(verification.duplicate_images as string) as any[]).length : 0,
          price_anomaly: verification?.price_anomaly_check === 1,
          anomaly_reason: verification?.anomaly_reason || '',
          risk_score: verification?.price_anomaly_check === 1 ? 85 : 20,
          details: verification?.final_verdict || ''
        }
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: '获取核验信息失败' });
  }
});

export default router;
