import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/behavior', authMiddleware, (req: AuthRequest, res) => {
  const { propertyId, action, duration = 0 } = req.body;
  
  if (!propertyId || !action) {
    res.status(400).json({ message: '缺少必要参数' });
    return;
  }

  db.prepare(
    'INSERT INTO user_behavior (user_id, property_id, action, duration) VALUES (?, ?, ?, ?)'
  ).run(req.user!.id, propertyId, action, duration);

  res.json({ message: '记录成功' });
});

router.get('/favorites', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?'
  ).get(req.user!.id) as { count: number };

  const list = db.prepare(
    `SELECT f.id as fav_id, f.created_at as fav_time, p.*
     FROM favorites f
     JOIN properties p ON f.property_id = p.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(req.user!.id, Number(pageSize), offset);

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/favorites', authMiddleware, (req: AuthRequest, res) => {
  const { propertyId } = req.body;
  
  if (!propertyId) {
    res.status(400).json({ message: '缺少房源ID' });
    return;
  }

  try {
    db.prepare('INSERT INTO favorites (user_id, property_id) VALUES (?, ?)').run(req.user!.id, propertyId);
    db.prepare('UPDATE properties SET favorite_count = favorite_count + 1 WHERE id = ?').run(propertyId);
    res.json({ message: '收藏成功' });
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) {
      res.status(400).json({ message: '已收藏该房源' });
    } else {
      res.status(500).json({ message: '操作失败' });
    }
  }
});

router.delete('/favorites/:id', authMiddleware, (req: AuthRequest, res) => {
  const result = db.prepare('DELETE FROM favorites WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  
  if (result.changes > 0) {
    res.json({ message: '取消收藏成功' });
  } else {
    res.status(404).json({ message: '收藏记录不存在' });
  }
});

router.get('/consultations', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM consultations WHERE user_id = ?'
  ).get(req.user!.id) as { count: number };

  const list = db.prepare(
    `SELECT c.*, p.title as property_title, p.images as property_images,
            a.real_name as agent_name, a.phone as agent_phone
     FROM consultations c
     JOIN properties p ON c.property_id = p.id
     LEFT JOIN agents a ON c.agent_id = a.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(req.user!.id, Number(pageSize), offset);

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/consultations', authMiddleware, (req: AuthRequest, res) => {
  const { propertyId, content, agentId } = req.body;
  
  if (!propertyId || !content) {
    res.status(400).json({ message: '缺少必要参数' });
    return;
  }

  db.prepare(
    'INSERT INTO consultations (user_id, property_id, content, agent_id) VALUES (?, ?, ?, ?)'
  ).run(req.user!.id, propertyId, content, agentId || null);

  res.json({ message: '咨询提交成功' });
});

router.get('/recommendations', authMiddleware, (req: AuthRequest, res) => {
  const { limit = 10 } = req.query;
  const userId = req.user!.id;

  const behaviors = db.prepare(
    `SELECT property_id, action, COUNT(*) as count
     FROM user_behavior
     WHERE user_id = ? AND action IN ('view', 'favorite', 'consult')
     GROUP BY property_id, action
     ORDER BY count DESC
     LIMIT 30`
  ).all(userId);

  let propertyIds: number[] = [];
  let reasons: Record<number, string[]> = {};

  if (behaviors.length > 0) {
    const behaviorMap: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    const districtCount: Record<string, number> = {};
    const roomCount: Record<number, number> = {};
    let minPrice = Infinity;
    let maxPrice = 0;
    let totalArea = 0;
    let areaCount = 0;

    for (const b of behaviors as any[]) {
      const prop = db.prepare('SELECT * FROM properties WHERE id = ?').get(b.property_id) as any;
      if (!prop) continue;

      const actionWeight = b.action === 'favorite' ? 3 : b.action === 'consult' ? 2 : 1;
      behaviorMap[prop.id] = (behaviorMap[prop.id] || 0) + b.count * actionWeight;

      typeCount[prop.type] = (typeCount[prop.type] || 0) + b.count;
      districtCount[prop.district] = (districtCount[prop.district] || 0) + b.count;
      if (prop.room_count > 0) {
        roomCount[prop.room_count] = (roomCount[prop.room_count] || 0) + b.count;
      }
      if (prop.price_unit === 'wan') {
        minPrice = Math.min(minPrice, prop.price);
        maxPrice = Math.max(maxPrice, prop.price);
      }
      totalArea += prop.area;
      areaCount++;
    }

    const preferredType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const preferredDistrict = Object.entries(districtCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const preferredRooms = Object.entries(roomCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const avgArea = areaCount > 0 ? totalArea / areaCount : 100;

    const params: any[] = [];
    let where = ["status = 'active'"];

    if (preferredType) {
      where.push('type = ?');
      params.push(preferredType);
    }
    if (preferredDistrict) {
      where.push('district = ?');
      params.push(preferredDistrict);
    }

    const viewedIds = Object.keys(behaviorMap).map(Number);
    if (viewedIds.length > 0) {
      where.push(`id NOT IN (${viewedIds.map(() => '?').join(',')})`);
      params.push(...viewedIds);
    }

    const candidates = db.prepare(
      `SELECT p.*, 
              d.credit_level as developer_credit,
              pd.school_district, pd.plot_ratio, pd.green_ratio
       FROM properties p
       LEFT JOIN developers d ON p.developer_id = d.id
       LEFT JOIN property_details pd ON p.id = pd.property_id
       WHERE ${where.join(' AND ')}
       LIMIT 50`
    ).all(...params);

    const marketData = db.prepare(
      `SELECT district, type, avg_price, destocking_cycle, loan_rate
       FROM market_data
       ORDER BY data_date DESC
       LIMIT 10`
    ).all();

    const scored = (candidates as any[]).map(p => {
      let score = 0;
      let reason: string[] = [];

      if (preferredType && p.type === preferredType) {
        score += 30;
        reason.push(`您关注${preferredType === 'new' ? '新房' : preferredType === 'secondhand' ? '二手房' : preferredType === 'rental' ? '租房' : '商业物业'}`);
      }
      if (preferredDistrict && p.district === preferredDistrict) {
        score += 25;
        reason.push(`位于您偏好的${preferredDistrict}`);
      }
      if (preferredRooms && p.room_count === Number(preferredRooms)) {
        score += 20;
        reason.push(`户型匹配（${preferredRooms}居室）`);
      }
      if (p.price_unit === 'wan' && minPrice < maxPrice) {
        if (p.price >= minPrice * 0.8 && p.price <= maxPrice * 1.2) {
          score += 15;
          reason.push('价格在您关注的区间内');
        }
      }
      if (p.area >= avgArea * 0.7 && p.area <= avgArea * 1.3) {
        score += 10;
        reason.push('面积符合您的浏览偏好');
      }
      if (p.is_verified) {
        score += 10;
        reason.push('真房源认证');
      }
      if (p.developer_credit === 'AAA') {
        score += 15;
        reason.push('开发商信用等级AAA');
      }
      if (p.school_district) {
        score += 10;
        reason.push(`学区房（${p.school_district}）`);
      }
      if (p.plot_ratio && p.plot_ratio < 2.5) {
        score += 5;
        reason.push('低容积率，居住舒适');
      }

      const marketMatch = (marketData as any[]).find(m => m.district === p.district && m.type === p.type);
      if (marketMatch) {
        if (marketMatch.destocking_cycle < 6) {
          score += 10;
          reason.push('市场去化周期短，房源抢手');
        }
        if (marketMatch.loan_rate < 4) {
          score += 5;
          reason.push('当前贷款利率优惠');
        }
        if (p.price_unit === 'wan') {
          const unitPrice = p.price * 10000 / p.area;
          if (unitPrice < marketMatch.avg_price * 1.05) {
            score += 15;
            reason.push('低于区域均价，性价比高');
          }
        }
      }

      score += Math.min(p.view_count / 100, 10);
      score += Math.min(p.favorite_count / 50, 10);

      reasons[p.id] = reason;
      return { ...p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    propertyIds = scored.slice(0, Number(limit)).map(p => p.id);
  }

  if (propertyIds.length < Number(limit)) {
    const hot = db.prepare(
      `SELECT id FROM properties 
       WHERE status = 'active'
       ${propertyIds.length ? `AND id NOT IN (${propertyIds.map(() => '?').join(',')})` : ''}
       ORDER BY view_count DESC
       LIMIT ?`
    ).all(...propertyIds, Number(limit) - propertyIds.length);
    
    const hotIds = hot.map((p: any) => p.id);
    hotIds.forEach(id => {
      reasons[id] = ['热门房源，多人关注'];
    });
    propertyIds = [...propertyIds, ...hotIds];
  }

  if (propertyIds.length === 0) {
    const hot = db.prepare(
      "SELECT id FROM properties WHERE status = 'active' ORDER BY view_count DESC LIMIT ?"
    ).all(Number(limit));
    const hotIds = hot.map((p: any) => p.id);
    hotIds.forEach(id => {
      reasons[id] = ['热门房源，多人关注'];
    });
    propertyIds = hotIds;
  }

  const list = db.prepare(
    `SELECT id, title, type, price, price_unit, area, district, community, 
            room_count, hall_count, images, view_count, favorite_count, is_verified
     FROM properties WHERE id IN (${propertyIds.map(() => '?').join(',')})`
  ).all(...propertyIds);

  const listWithReasons = (list as any[]).map(p => ({
    ...p,
    reasons: reasons[p.id] || ['智能推荐']
  }));

  listWithReasons.sort((a, b) => propertyIds.indexOf(a.id) - propertyIds.indexOf(b.id));

  res.json({ list: listWithReasons });
});

export default router;
