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
    `SELECT p.id, p.title, p.type, p.category, p.price, p.price_unit, p.area, p.floor, p.orientation, p.decoration, 
            p.building_age, p.address, p.district, p.community, p.room_count, p.hall_count, p.bathroom_count,
            p.features, p.images, p.is_verified, p.view_count, p.favorite_count, p.created_at,
            p.price_warning, p.price_deviation,
            EXISTS(SELECT 1 FROM owner_confirmations oc WHERE oc.property_id = p.id AND oc.confirmed = 1) as owner_confirmed,
            (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id AND pi.is_duplicate = 1) as duplicate_images,
            EXISTS(SELECT 1 FROM transactions t JOIN regulatory_records rr ON t.id = rr.transaction_id 
                   WHERE t.property_id = p.id AND rr.status = 'synced') as has_regulatory
     FROM properties p ${whereSql}
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
            d.id as developer_id, d.company_name as developer_name, d.credit_level as developer_credit,
            EXISTS(SELECT 1 FROM owner_confirmations oc WHERE oc.property_id = p.id AND oc.confirmed = 1) as owner_confirmed,
            (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id AND pi.is_duplicate = 1) as duplicate_images,
            EXISTS(SELECT 1 FROM transactions t JOIN regulatory_records rr ON t.id = rr.transaction_id 
                   WHERE t.property_id = p.id AND rr.status = 'synced') as has_regulatory
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
  const ownerConfirmations = db.prepare(
    `SELECT oc.*, u.username as owner_name
     FROM owner_confirmations oc
     JOIN users u ON oc.owner_id = u.id
     WHERE oc.property_id = ?
     ORDER BY oc.created_at DESC`
  ).all(req.params.id);

  db.prepare('UPDATE properties SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

  res.json({ ...property, detail: detail || null, ownerConfirmations });
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

router.get('/recommendations/list', (req, res) => {
  const { limit = 10 } = req.query;

  const candidates = db.prepare(
    `SELECT p.*, 
            d.credit_level as developer_credit,
            pd.school_district, pd.plot_ratio, pd.green_ratio
     FROM properties p
     LEFT JOIN developers d ON p.developer_id = d.id
     LEFT JOIN property_details pd ON p.id = pd.property_id
     WHERE p.status = 'active'
     ORDER BY p.view_count DESC, p.favorite_count DESC
     LIMIT 50`
  ).all();

  const marketData = db.prepare(
    `SELECT district, type, avg_price, destocking_cycle, loan_rate
     FROM market_data
     ORDER BY data_date DESC
     LIMIT 10`
  ).all();

  const scored = (candidates as any[]).map(p => {
    let score = 0;
    let reasons: string[] = [];

    if (p.is_verified) {
      score += 20;
      reasons.push('真房源认证');
    }
    if (p.developer_credit === 'AAA') {
      score += 15;
      reasons.push('开发商信用等级AAA');
    } else if (p.developer_credit === 'AA') {
      score += 10;
      reasons.push('开发商信用等级AA');
    }
    if (p.school_district) {
      score += 15;
      reasons.push(`学区房（${p.school_district}）`);
    }
    if (p.plot_ratio && p.plot_ratio < 2.5) {
      score += 10;
      reasons.push('低容积率，居住舒适');
    }
    if (p.green_ratio && p.green_ratio > 35) {
      score += 10;
      reasons.push('绿化率高，环境优美');
    }

    const marketMatch = (marketData as any[]).find(m => m.district === p.district && m.type === p.type);
    if (marketMatch) {
      if (marketMatch.destocking_cycle < 6) {
        score += 15;
        reasons.push(`去化周期${marketMatch.destocking_cycle}个月，房源抢手`);
      } else if (marketMatch.destocking_cycle < 12) {
        score += 8;
        reasons.push(`去化周期${marketMatch.destocking_cycle}个月，市场健康`);
      }
      if (marketMatch.loan_rate < 4) {
        score += 8;
        reasons.push(`当前利率${marketMatch.loan_rate}%，贷款优惠`);
      }
      if (p.price_unit === 'wan') {
        const unitPrice = p.price * 10000 / p.area;
        if (unitPrice < marketMatch.avg_price * 1.05) {
          score += 20;
          reasons.push(`单价低于区域均价${marketMatch.avg_price?.toLocaleString()}元/㎡，性价比高`);
        } else if (unitPrice < marketMatch.avg_price * 1.15) {
          score += 10;
          reasons.push(`价格与区域均价持平，合理区间`);
        }
      }
    }

    score += Math.min(p.view_count / 50, 15);
    score += Math.min(p.favorite_count / 30, 10);

    if (p.view_count > 100) {
      reasons.push(`${p.view_count}次浏览，高人气房源`);
    }
    if (p.favorite_count > 20) {
      reasons.push(`${p.favorite_count}人收藏，广受欢迎`);
    }

    return { ...p, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);

  const list = scored.slice(0, Number(limit)).map(p => ({
    id: p.id,
    title: p.title,
    type: p.type,
    price: p.price,
    price_unit: p.price_unit,
    area: p.area,
    district: p.district,
    community: p.community,
    room_count: p.room_count,
    hall_count: p.hall_count,
    images: p.images,
    view_count: p.view_count,
    favorite_count: p.favorite_count,
    is_verified: p.is_verified,
    reasons: p.reasons.slice(0, 4),
  }));

  res.json({ list });
});

export default router;
